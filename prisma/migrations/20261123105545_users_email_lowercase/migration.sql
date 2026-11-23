-- Email disimpan dalam huruf kecil agar users_email_key juga unik tanpa membedakan huruf besar/kecil.
ALTER TABLE "users" ADD CONSTRAINT "users_email_lowercase" CHECK ("email" = lower("email"));
