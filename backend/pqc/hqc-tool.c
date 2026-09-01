/*
 * Real liboqs-backed HQC keygen/encapsulate/decapsulate.
 *
 * Used because OpenSSL's oqs-provider can't serialise HQC keys at all
 * yet: HQC has no assigned OID pending standardisation (shown as NULL
 * in oqs-provider's own OID table), so every openssl genpkey/pkeyutl
 * invocation for it fails with "No encoders were found", verified
 * directly. This talks to liboqs's C API instead - the same real
 * reference implementation every other HQC tool uses, just without
 * going through OpenSSL's own key-encoding layer.
 *
 * Every hex buffer this reads is validated against the exact expected
 * length for the requested variant before being written into a
 * fixed-size buffer, so malformed or wrong-length input is rejected
 * rather than overrunning anything.
 */
#include <oqs/oqs.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

static const char *alg_for(const char *variant) {
  if (strcmp(variant, "HQC-128") == 0) return OQS_KEM_alg_hqc_1;
  if (strcmp(variant, "HQC-192") == 0) return OQS_KEM_alg_hqc_3;
  if (strcmp(variant, "HQC-256") == 0) return OQS_KEM_alg_hqc_5;
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

static int do_keygen(OQS_KEM *kem, const char *variant) {
  unsigned char *pk = malloc(kem->length_public_key);
  unsigned char *sk = malloc(kem->length_secret_key);
  int rc = 0;
  if (OQS_KEM_keypair(kem, pk, sk) != OQS_SUCCESS) {
    fprintf(stderr, "{\"error\":\"keygen failed\"}\n");
    rc = 1;
  } else {
    printf("{\"variant\":\"%s\",\"publicKeyHex\":\"", variant);
    print_hex(pk, kem->length_public_key);
    printf("\",\"privateKeyHex\":\"");
    print_hex(sk, kem->length_secret_key);
    printf("\",\"publicKeyBytes\":%zu,\"privateKeyBytes\":%zu}\n",
           kem->length_public_key, kem->length_secret_key);
  }
  free(pk);
  free(sk);
  return rc;
}

static int do_encap(OQS_KEM *kem, const char *pub_hex) {
  unsigned char *pk = malloc(kem->length_public_key);
  int rc = 0;
  if (hex_to_bytes(pub_hex, pk, kem->length_public_key) != 0) {
    fprintf(stderr, "{\"error\":\"invalid public key hex\"}\n");
    rc = 1;
  } else {
    unsigned char *ct = malloc(kem->length_ciphertext);
    unsigned char *ss = malloc(kem->length_shared_secret);
    if (OQS_KEM_encaps(kem, ct, ss, pk) != OQS_SUCCESS) {
      fprintf(stderr, "{\"error\":\"encapsulation failed\"}\n");
      rc = 1;
    } else {
      printf("{\"ciphertextHex\":\"");
      print_hex(ct, kem->length_ciphertext);
      printf("\",\"secretHex\":\"");
      print_hex(ss, kem->length_shared_secret);
      printf("\",\"ciphertextBytes\":%zu,\"secretBytes\":%zu}\n",
             kem->length_ciphertext, kem->length_shared_secret);
    }
    free(ct);
    free(ss);
  }
  free(pk);
  return rc;
}

static int do_decap(OQS_KEM *kem, const char *priv_hex, const char *ct_hex) {
  unsigned char *sk = malloc(kem->length_secret_key);
  unsigned char *ct = malloc(kem->length_ciphertext);
  int rc = 0;
  if (hex_to_bytes(priv_hex, sk, kem->length_secret_key) != 0 ||
      hex_to_bytes(ct_hex, ct, kem->length_ciphertext) != 0) {
    fprintf(stderr, "{\"error\":\"invalid private key or ciphertext hex\"}\n");
    rc = 1;
  } else {
    unsigned char *ss = malloc(kem->length_shared_secret);
    if (OQS_KEM_decaps(kem, ss, ct, sk) != OQS_SUCCESS) {
      fprintf(stderr, "{\"error\":\"decapsulation failed\"}\n");
      rc = 1;
    } else {
      printf("{\"secretHex\":\"");
      print_hex(ss, kem->length_shared_secret);
      printf("\",\"secretBytes\":%zu}\n", kem->length_shared_secret);
    }
    free(ss);
  }
  free(sk);
  free(ct);
  return rc;
}

int main(int argc, char **argv) {
  if (argc < 3) {
    fprintf(stderr,
            "{\"error\":\"usage: hqc-tool keygen <variant> | encap <variant> "
            "<pubkey-hex> | decap <variant> <privkey-hex> <ciphertext-hex>\"}\n");
    return 1;
  }

  const char *command = argv[1];
  const char *variant = argv[2];
  const char *alg = alg_for(variant);
  if (alg == NULL) {
    fprintf(stderr, "{\"error\":\"variant must be HQC-128, HQC-192, or HQC-256\"}\n");
    return 1;
  }

  OQS_KEM *kem = OQS_KEM_new(alg);
  if (kem == NULL) {
    fprintf(stderr, "{\"error\":\"failed to initialise KEM\"}\n");
    return 1;
  }

  int rc;
  if (strcmp(command, "keygen") == 0) {
    rc = do_keygen(kem, variant);
  } else if (strcmp(command, "encap") == 0 && argc >= 4) {
    rc = do_encap(kem, argv[3]);
  } else if (strcmp(command, "decap") == 0 && argc >= 5) {
    rc = do_decap(kem, argv[3], argv[4]);
  } else {
    fprintf(stderr, "{\"error\":\"unknown command or missing arguments\"}\n");
    rc = 1;
  }

  OQS_KEM_free(kem);
  return rc;
}
