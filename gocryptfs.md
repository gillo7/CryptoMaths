## Optional: Create a vault for your keys

In this part of the lab, we will solve a big security issue we created during Lab 3.

In the AWS lab, we created a key pair, and we downloaded it. This is problematic. Anyone with access to your computer could easily read this in the clear. And attackers particularly value file extensions such as `.pem` knowing that it will allow them further access.

How do we solve this? By creating a vault.

You have seen in class how Symmetric Keys work. Now let us see them being used in practice.

Firstly, on Ubuntu (or Kali, or Parrot), you need to install gocryptfs (and OpenSSL, if you have not yet done it, see above for instructions)

```bash
sudo apt install gocryptfs
```

Next, we need to create the directories that will be used as our vault, alongside a mounting point
```bash
mkdir vault open_vault
```

You always need two folders:
`vault` holds the encrypted data on disk. It is always there, always encrypted.
`open_vault` is the window into it. It is empty when locked and shows plaintext when mounted.

Then we need to initialise the vault with a password. Your vault will only be as secure as the password used to protect it!
```bash
gocryptfs -init vault
```
gocryptfs also prints a master key. Note it down somewhere safe -not on the computer!-, because it's your only way back in if you forget the password.

Now we will create an OpenSSL keypair (which will give us the same .pem file type than the one we got from AWS)
```bash
openssl genpkey -algorithm RSA -pkeyopt rsa_keygen_bits:2048 -out private.pem
openssl pkey -in private.pem -pubout -out public.pem
#then check your key
cat private.pem
```

Now we need to mount the vault, made possible by giving the password
```bash
gocryptfs vault open_vault
```

Now the vault is a directory in our Linux system, we can move the private key in it:
```bash
mv private.pem open_vault/
# Check that the key is there and unencrypted
ls open_vault
cat open_vault/private.pem
```

Now lock your vault! The following action will make open_vault an empty directory. 
```bash
fusermount -u open_vault
```
And you can see the encrypted data in the vault:
```bash
cd vault
# you will notice your private.pem file has been turned into random Base64
cat <whichever base64 your file has>
# you should be enable to make any sense of the encrypted file, as per the screenshot below
# and check that open_vault is empty
cd ..
ls -la open_vault
```

<img width="1221" height="805" alt="image" src="https://github.com/user-attachments/assets/c0aa3797-e80e-45bc-8a1b-946401b2a750" />


And if you need to get your data back, open your vault!
```bash
gocryptfs vault open_vault
cat open_vault/private.pem
```

And as a finishing touch, research what Symmetric key scheme is being used by gocryptfs, and which hashing scheme is used to protect the password, do you think it is safe? What sort of attack would ever have a chance to break into your vault?

