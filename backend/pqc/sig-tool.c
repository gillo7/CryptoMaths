/*
 * Real liboqs-backed FN-DSA (Falcon) keygen/sign/verify.
 *
 * Used for the same reason hqc-tool.c exists: FIPS 206 (FN-DSA) hasn't
 * even reached Initial Public Draft stage yet, so it has no assigned
 * OID and OpenSSL has no Falcon support at all (confirmed via
 * `openssl list -signature-algorithms`). This talks to liboqs's C API
 * directly instead - the same real reference implementation, just
 * without going through OpenSSL.
 *
 * Falcon signatures are variable-length (unlike HQC's fixed-size KEM
 * outputs), so the actual signature length written by OQS_SIG_sign is
 * what gets reported and hex-encoded, not the scheme's maximum buffer
 * size. Every hex buffer this reads is validated against the exact
 * expected length before being written into a fixed-size buffer, so
 * malformed or wrong-length input is rejected rather than overrunning
 * anything.
 */
#include <oqs/oqs.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

static const char *alg_for(const char *variant) {
  if (strcmp(variant, "Falcon-512") == 0) return OQS_SIG_alg_falcon_512;
  if (strcmp(variant, "Falcon-1024") == 0) return OQS_SIG_alg_falcon_1024;
  return NULL;
}

static void print_hex(const unsigned char *buf, size_t len) {
  for (size_t i = 0; i < len; i++) printf("%02x", buf[i]);
}

static int hex_to_bytes(const char *hex, unsigned char *out, size_t expected_len) {
  if (strlen(hex) != expected_len * 2) return -1;
  for (size_t i = 0; i < expected_len; i++) {
    unsigned int byte;
    if (sscanf(hex + i * 2, "%2x", &byte) != 1) return -1;
    out[i] = (unsigned char)byte;
  }
  return 0;
}

static int do_keygen(OQS_SIG *sig, const char *variant) {
  unsigned char *pk = malloc(sig->length_public_key);
  unsigned char *sk = malloc(sig->length_secret_key);
  int rc = 0;
  if (OQS_SIG_keypair(sig, pk, sk) != OQS_SUCCESS) {
    fprintf(stderr, "{\"error\":\"keygen failed\"}\n");
    rc = 1;
  } else {
    printf("{\"variant\":\"%s\",\"publicKeyHex\":\"", variant);
    print_hex(pk, sig->length_public_key);
    printf("\",\"privateKeyHex\":\"");
    print_hex(sk, sig->length_secret_key);
    printf("\",\"publicKeyBytes\":%zu,\"privateKeyBytes\":%zu}\n",
           sig->length_public_key, sig->length_secret_key);
  }
  free(pk);
  free(sk);
  return rc;
}

static int do_sign(OQS_SIG *sig, const char *priv_hex, const char *message) {
  unsigned char *sk = malloc(sig->length_secret_key);
  int rc = 0;
  if (hex_to_bytes(priv_hex, sk, sig->length_secret_key) != 0) {
    fprintf(stderr, "{\"error\":\"invalid private key hex\"}\n");
    rc = 1;
  } else {
    unsigned char *signature = malloc(sig->length_signature);
    size_t signature_len = 0;
    if (OQS_SIG_sign(sig, signature, &signature_len, (const unsigned char *)message,
                      strlen(message), sk) != OQS_SUCCESS) {
      fprintf(stderr, "{\"error\":\"signing failed\"}\n");
      rc = 1;
    } else {
      printf("{\"signatureHex\":\"");
      print_hex(signature, signature_len);
      printf("\",\"signatureBytes\":%zu}\n", signature_len);
    }
    free(signature);
  }
  free(sk);
  return rc;
}

static int do_verify(OQS_SIG *sig, const char *pub_hex, const char *message,
                      const char *sig_hex) {
  unsigned char *pk = malloc(sig->length_public_key);
  int rc = 0;
  size_t sig_hex_len = strlen(sig_hex);
  if (sig_hex_len % 2 != 0 || hex_to_bytes(pub_hex, pk, sig->length_public_key) != 0) {
    fprintf(stderr, "{\"error\":\"invalid public key or signature hex\"}\n");
    rc = 1;
  } else {
    size_t signature_len = sig_hex_len / 2;
    unsigned char *signature = malloc(signature_len);
    if (hex_to_bytes(sig_hex, signature, signature_len) != 0) {
      fprintf(stderr, "{\"error\":\"invalid signature hex\"}\n");
      rc = 1;
    } else {
      OQS_STATUS result = OQS_SIG_verify(sig, (const unsigned char *)message,
                                          strlen(message), signature, signature_len, pk);
      printf("{\"verified\":%s}\n", result == OQS_SUCCESS ? "true" : "false");
    }
    free(signature);
  }
  free(pk);
  return rc;
}

int main(int argc, char **argv) {
  if (argc < 3) {
    fprintf(stderr,
            "{\"error\":\"usage: sig-tool keygen <variant> | sign <variant> "
            "<privkey-hex> <message> | verify <variant> <pubkey-hex> <message> "
            "<signature-hex>\"}\n");
    return 1;
  }

  const char *command = argv[1];
  const char *variant = argv[2];
  const char *alg = alg_for(variant);
  if (alg == NULL) {
    fprintf(stderr, "{\"error\":\"variant must be Falcon-512 or Falcon-1024\"}\n");
    return 1;
  }

  OQS_SIG *sig = OQS_SIG_new(alg);
  if (sig == NULL) {
    fprintf(stderr, "{\"error\":\"failed to initialise signature scheme\"}\n");
    return 1;
  }

  int rc;
  if (strcmp(command, "keygen") == 0) {
    rc = do_keygen(sig, variant);
  } else if (strcmp(command, "sign") == 0 && argc >= 5) {
    rc = do_sign(sig, argv[3], argv[4]);
  } else if (strcmp(command, "verify") == 0 && argc >= 6) {
    rc = do_verify(sig, argv[3], argv[4], argv[5]);
  } else {
    fprintf(stderr, "{\"error\":\"unknown command or missing arguments\"}\n");
    rc = 1;
  }

  OQS_SIG_free(sig);
  return rc;
}
