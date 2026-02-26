"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const data_model_1 = require("@iroha2/data-model");
const crypto_target_node_1 = require("@iroha2/crypto-target-node");
const express_1 = __importDefault(require("express"));
const morgan_1 = __importDefault(require("morgan"));
const client_1 = require("@iroha2/client");

const app = (0, express_1.default)();
const port = process.env.PORT || 8001;

// CORS middleware
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    if (req.method === 'OPTIONS') {
        return res.sendStatus(200);
    }
    next();
});

app.use((0, morgan_1.default)('combined'));
app.use(express_1.default.json({ limit: '50mb' }));
app.use(express_1.default.urlencoded({ limit: '50mb', extended: true }));

// Bytes utilities
const stringEncoder = new TextEncoder();
function encodeStringAsUtf8Bytes(val) {
    return stringEncoder.encode(val);
}

// Crypto utilities
function createHash(payload) {
    return crypto_target_node_1.crypto.Hash.hash('array', payload).bytes();
}

function createKeyPairWithSeed(seed) {
    const keypair = crypto_target_node_1.crypto.KeyGenConfiguration.default().useSeed('array', seed).generate();
    return keypair;
}

function createEmailSignature2(email, keypair) {
    let bt = ['array', createHash(encodeStringAsUtf8Bytes(email))];
    return keypair.sign(...bt);
}

function makeid() {
    let text = '';
    let possible = '0123456789ABCDEF';
    for (let i = 0; i < 64; i++)
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    return text;
}

function appendSignatureWithKeyPair(tx, keyPair) {
    const signer = new client_1.Signer(tx.payload.authority, keyPair);
    const signature = (0, client_1.signTransaction)(tx.payload, signer);
    return data_model_1.datamodel.SignedTransactionV1({
        payload: tx.payload,
        signatures: data_model_1.datamodel.SortedVecSignature([...tx.signatures, signature]),
    });
}

function sign_versioned_tx(encodedVersionedTransaction, keypair) {
    (0, client_1.setCrypto)(crypto_target_node_1.crypto);
    const txDecoded = data_model_1.datamodel.SignedTransaction.fromBuffer(encodedVersionedTransaction);
    const txNew = data_model_1.datamodel.SignedTransaction('V1', appendSignatureWithKeyPair(txDecoded.enum.as('V1'), keypair));
    return data_model_1.datamodel.SignedTransaction.toBuffer(txNew);
}

function key_pair_from_hex_pair(pubHex, privHex) {
    const ED25519_DIGEST = 'ed25519';
    const MAGIC_ED25519_MULTIHASH_PREFIX = 'ed0120';
    let payLoad = ['array', from_hex(MAGIC_ED25519_MULTIHASH_PREFIX + pubHex)];
    const pub = crypto_target_node_1.crypto.PublicKey.fromMultihash('instance', crypto_target_node_1.crypto.Multihash.fromBytes(...payLoad));
    const priv = crypto_target_node_1.crypto.PrivateKey.fromJSON({
        payload: privHex,
        digest_function: ED25519_DIGEST,
    });
    return crypto_target_node_1.crypto.KeyPair.fromPrivateKey(priv);
}

function from_hex(hex) {
    return Uint8Array.from(Buffer.from(hex, 'hex'));
}

function to_hex(bytes) {
    return [...bytes].map((x) => x.toString(16).padStart(2, '0')).join('');
}

// Health check
app.get('/', (req, res) => {
    res.json({ 
        status: 'ok', 
        service: 'fib-iroha-helper',
        version: '1.0.0'
    });
});

app.get('/health', (req, res) => {
    res.json({ status: 'healthy' });
});

app.post('/getaccountname', (req, res) => {
    const email = req.body.email;
    res.send(to_hex(createHash(encodeStringAsUtf8Bytes(email))));
});

app.post('/gethash', (req, res) => {
    const email = req.body.email;
    const password = req.body.password;
    const hash = createHash(encodeStringAsUtf8Bytes(email + password));
    res.send(to_hex(hash));
});

app.post('/newdomain', (req, res) => {
    const username = req.body.email;
    const hash = req.body.hash;
    const domainName = req.body.domainName;
    const keypair = createKeyPairWithSeed(from_hex(hash));
    const publicKey = keypair.publicKey();
    const salt = makeid().toLowerCase();
    const blockchain_seed = createHash(from_hex(hash + salt));
    const auth_keypair = createKeyPairWithSeed(blockchain_seed);
    const response = {
        accountDetails: {
            authPublicKey: to_hex(publicKey.payload()),
            domainName: domainName,
            email: username,
            irohaPublicKey: to_hex(auth_keypair.publicKey().payload()),
            salt: salt,
        },
        accountName: to_hex(createHash(encodeStringAsUtf8Bytes(username + domainName))),
    };
    res.json(response);
});

app.post('/newdomain_v2', (req, res) => {
    const username = req.body.email;
    const hash = req.body.hash;
    const domainName = req.body.domainName;
    const numSub = req.body.numsub;
    const contype = req.body.contype;
    const keypair = createKeyPairWithSeed(from_hex(hash));
    const publicKey = keypair.publicKey();
    const pvtKey = keypair.privateKey();
    const salt = makeid().toLowerCase();
    const blockchain_seed = createHash(from_hex(hash + salt));
    const auth_keypair = createKeyPairWithSeed(blockchain_seed);
    const response = {
        accountDetails: {
            authPublicKey: to_hex(publicKey.payload()),
            domainName: domainName,
            email: username,
            irohaPublicKey: to_hex(auth_keypair.publicKey().payload()),
            peerConnectionType: contype,
            peerType: numSub,
            salt: salt,
            irohaPrivateKey: to_hex(auth_keypair.privateKey().payload()),
            authPrivateKey: to_hex(pvtKey.payload()),
        },
        accountName: to_hex(createHash(encodeStringAsUtf8Bytes(username + domainName))),
    };
    res.json(response);
});

app.post('/newuser', (req, res) => {
    const username = req.body.email;
    const hash = req.body.hash;
    const domainName = req.body.domainName;
    const keypair = createKeyPairWithSeed(from_hex(hash));
    const publicKey = keypair.publicKey();
    const pvtKey = keypair.privateKey();
    const salt = makeid().toLowerCase();
    const blockchain_seed = createHash(from_hex(hash + salt));
    const auth_keypair = createKeyPairWithSeed(blockchain_seed);
    const response = {
        accountDetails: {
            authPublicKey: to_hex(publicKey.payload()),
            domainName: domainName,
            email: username,
            irohaPublicKey: to_hex(auth_keypair.publicKey().payload()),
            salt: salt,
            irohaPrivateKey: to_hex(auth_keypair.privateKey().payload()),
            authPrivateKey: to_hex(pvtKey.payload()),
        },
        accountName: to_hex(createHash(encodeStringAsUtf8Bytes(username))),
    };
    res.json(response);
});

app.post('/newuser_v2', (req, res) => {
    const username = req.body.email;
    const hash = req.body.hash;
    const domainName = req.body.domainName;
    const numSub = req.body.numsub;
    const contype = req.body.contype;
    const keypair = createKeyPairWithSeed(from_hex(hash));
    const publicKey = keypair.publicKey();
    const pvtKey = keypair.privateKey();
    const salt = makeid().toLowerCase();
    const blockchain_seed = createHash(from_hex(hash + salt));
    const auth_keypair = createKeyPairWithSeed(blockchain_seed);
    const response = {
        accountDetails: {
            authPublicKey: to_hex(publicKey.payload()),
            domainName: domainName,
            email: username,
            irohaPublicKey: to_hex(auth_keypair.publicKey().payload()),
            peerConnectionType: contype,
            peerType: numSub,
            salt: salt,
            irohaPrivateKey: to_hex(auth_keypair.privateKey().payload()),
            authPrivateKey: to_hex(pvtKey.payload()),
        },
        accountName: to_hex(createHash(encodeStringAsUtf8Bytes(username))),
    };
    res.json(response);
});

app.post('/newuser_v2_salt', (req, res) => {
    const username = req.body.email;
    const hash = req.body.hash;
    const domainName = req.body.domainName;
    const numSub = req.body.numsub;
    const contype = req.body.contype;
    const saltsend = req.body.salt;
    const keypair = createKeyPairWithSeed(from_hex(hash));
    const publicKey = keypair.publicKey();
    const pvtKey = keypair.privateKey();
    const salt = saltsend;
    const blockchain_seed = createHash(from_hex(hash + salt));
    const auth_keypair = createKeyPairWithSeed(blockchain_seed);
    const response = {
        accountDetails: {
            authPublicKey: to_hex(publicKey.payload()),
            domainName: domainName,
            email: username,
            irohaPublicKey: to_hex(auth_keypair.publicKey().payload()),
            peerConnectionType: contype,
            peerType: numSub,
            salt: salt,
            irohaPrivateKey: to_hex(auth_keypair.privateKey().payload()),
            authPrivateKey: to_hex(pvtKey.payload()),
        },
        accountName: to_hex(createHash(encodeStringAsUtf8Bytes(username))),
    };
    res.json(response);
});

app.post('/signlogin', (req, res) => {
    const email = req.body.email;
    const hash = req.body.hash;
    const keypair = createKeyPairWithSeed(from_hex(hash));
    const publicKey = keypair.publicKey();
    let signa = createEmailSignature2(email, keypair);
    const signHex = signa.payload('hex');
    const request = { email: email, signature: signHex, authPublicKeyHex: to_hex(publicKey.payload()) };
    res.json(request);
});

app.post('/signtxdata', (req, res) => {
    const hash = req.body.hash;
    const data2sign = req.body.data;
    const salt = req.body.salt;
    const blockchain_seed = createHash(from_hex(hash + salt));
    const auth_keypair = createKeyPairWithSeed(blockchain_seed);
    let PUB_KEY_HEX = to_hex(auth_keypair.publicKey().payload());
    let PRIV_KEY_HEX = to_hex(auth_keypair.privateKey().payload());
    const KEY_PAIR = key_pair_from_hex_pair(PUB_KEY_HEX, PRIV_KEY_HEX);
    const signedTx = sign_versioned_tx(from_hex(data2sign), KEY_PAIR);
    res.send(to_hex(signedTx));
});

app.post('/signtxdata2', (req, res) => {
    const data2sign = req.body.data;
    const pubkey = req.body.pubkey;
    const pvtkey = req.body.pvtkey;
    const KEY_PAIR = key_pair_from_hex_pair(pubkey, pvtkey);
    const signedTx = sign_versioned_tx(from_hex(data2sign), KEY_PAIR);
    res.send(to_hex(signedTx));
});

app.post('/signlogin2', (req, res) => {
    const email = req.body.email;
    const pubkey = req.body.pubkey;
    const pvtkey = req.body.pvtkey;
    const keypair = key_pair_from_hex_pair(pubkey, pvtkey);
    const publicKey = keypair.publicKey();
    let signa = createEmailSignature2(email, keypair);
    const signHex = signa.payload('hex');
    const request = { email: email, signature: signHex, authPublicKeyHex: to_hex(publicKey.payload()) };
    res.json(request);
});

app.listen(port, () => {
    console.log(`🚀 FIB Iroha Helper listening on port ${port}`);
});
