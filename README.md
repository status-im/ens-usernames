# Status ENS Usernames

DApp to register usernames for Status Network, using ENS subnodes as usernames and Public Resolver to configure public key and/or public address.

Usernames eliminates the need to copy/scan - and worse, type - long hexadecimal addresses / public keys, by providing an ENS subdomain registry and recognition of ENS names in Status for interacting with other people in Status.

Requires https://github.com/creationix/nvm
Usage: 
 ```
 nvm install v8.9.4
 nvm use v8.9.4
 npm install -g embark
 git clone https://github.com/status-im/ens-usernames.git
 cd ens-usernames
 npm install
 embark test
 embark blockchain
 embark run
 ```