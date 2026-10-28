import assert from "node:assert/strict";
import test from "node:test";
import {
  getApplicationByToken,
  getPublicReceiptStatus,
  ownerConfirmProof,
  ownerListProofs,
  ownerRejectProof,
  submitApplication,
  submitPaymentProof,
} from "../netlify/receipts-lib.mjs";

function memoryStore() {
  const data = new Map();
  return {
    async get(key, options) {
      if (!data.has(key)) return options && options.type === "json" ? null : null;
      return data.get(key);
    },
    async set(key, value) {
      data.set(key, value);
    },
    async setJSON(key, value) {
      data.set(key, value);
    },
    async list() {
      return {
        blobs: Array.from(data.keys())
          .filter(function (key) { return key.indexOf("proofs/") === 0; })
          .map(function (key) { return { key: key }; }),
      };
    },
  };
}

test("application, proof, confirm, and public status", async function () {
  process.env.OWNER_PASSWORD = "correct-horse";
  const store = memoryStore();
  const saved = await submitApplication(store, {
    applicationId: "APP-1",
    applicantName: "Ada Applicant",
    applicantEmail: "ada@example.com",
    applicantPhone: "555",
    propertyAddress: "1 Main",
    paymentEmail: "pay@example.com",
  });
  assert.equal(saved.application_fee, 70);
  assert.ok(saved.access_token);

  const again = await submitApplication(store, { applicationId: "APP-1" });
  assert.equal(again.access_token, saved.access_token);

  const proof = await submitPaymentProof(store, {
    token: saved.access_token,
    screenshotUrl: "https://cdn.example/shot.jpg",
    publicId: "shot",
  });
  assert.equal(proof.status, "pending");
  assert.equal(proof.replay, false);

  const replay = await submitPaymentProof(store, {
    token: saved.access_token,
    screenshotUrl: "https://cdn.example/other.jpg",
  });
  assert.equal(replay.replay, true);
  assert.equal(replay.receipt_number, proof.receipt_number);

  const pending = await getApplicationByToken(store, { token: saved.access_token });
  assert.equal(pending.proof_status, "pending");
  assert.equal(pending.applicant_email, "ada@example.com");

  const queue = await ownerListProofs(store, { password: "correct-horse" });
  assert.equal(queue.length, 1);
  assert.equal(queue[0].access_token, saved.access_token);

  await assert.rejects(
    function () { return ownerListProofs(store, { password: "nope" }); },
    /invalid password/
  );

  const confirmed = await ownerConfirmProof(store, {
    password: "correct-horse",
    receiptNumber: proof.receipt_number,
    amount: 140,
  });
  assert.equal(confirmed.replay, false);
  assert.equal(confirmed.confirmed_amount, 140);

  const paid = await getApplicationByToken(store, { token: saved.access_token });
  assert.equal(paid.proof_status, "paid");
  assert.equal(paid.receipt_amount, 140);

  const status = await getPublicReceiptStatus(store, { receiptNumber: proof.receipt_number });
  assert.deepEqual(status, { receipt_number: proof.receipt_number, status: "paid" });
  assert.equal(status.applicant_email, undefined);

  const second = await ownerConfirmProof(store, {
    password: "correct-horse",
    receiptNumber: proof.receipt_number,
    amount: 10,
  });
  assert.equal(second.replay, true);
  assert.equal(second.confirmed_amount, 140);
});

test("reject lets the applicant submit a new proof", async function () {
  process.env.OWNER_PASSWORD = "correct-horse";
  const store = memoryStore();
  const saved = await submitApplication(store, {
    applicationId: "APP-2",
    applicantName: "Bea",
    applicantEmail: "bea@example.com",
  });
  const first = await submitPaymentProof(store, {
    token: saved.access_token,
    screenshotUrl: "https://cdn.example/a.jpg",
  });
  const rejected = await ownerRejectProof(store, {
    password: "correct-horse",
    receiptNumber: first.receipt_number,
  });
  assert.equal(rejected.status, "rejected");

  const next = await submitPaymentProof(store, {
    token: saved.access_token,
    screenshotUrl: "https://cdn.example/b.jpg",
  });
  assert.equal(next.replay, false);
  assert.notEqual(next.receipt_number, first.receipt_number);

  const queue = await ownerListProofs(store, { password: "correct-horse" });
  assert.equal(queue[0].status, "pending");
  assert.equal(queue[1].status, "rejected");
});

test("reject invalid confirmations and protect paid receipts", async () => {
  process.env.OWNER_PASSWORD = 'correct-horse';
  const store = memoryStore();
  const app = await submitApplication(store, {applicationId:'APP-validation'});
  const proof = await submitPaymentProof(store, {token:app.access_token,screenshotUrl:'https://cdn.example/proof.jpg'});
  for (const amount of [0,-1,'invalid',100001]) {
    await assert.rejects(() => ownerConfirmProof(store,{password:'correct-horse',receiptNumber:proof.receipt_number,amount}), /amount received/);
  }
  await ownerConfirmProof(store,{password:'correct-horse',receiptNumber:proof.receipt_number,amount:70});
  await assert.rejects(() => ownerRejectProof(store,{password:'correct-horse',receiptNumber:proof.receipt_number}), /only pending/);
  assert.equal(await getApplicationByToken(store,{token:'missing'}),null);
  assert.equal(await getPublicReceiptStatus(store,{receiptNumber:'missing'}),null);
});

test("HTTP endpoint rejects malformed requests and inherited action names", async () => {
  const {default:handler}=await import('../netlify/functions/receipts.mjs');
  assert.equal((await handler(new Request('https://example.test/api/receipts'))).status,405);
  assert.equal((await handler(new Request('https://example.test/api/receipts',{method:'OPTIONS'}))).status,204);
  assert.equal((await handler(new Request('https://example.test/api/receipts',{method:'POST',body:'{'}))).status,400);
  for (const action of ['unknown','constructor','toString','__proto__']) {
    assert.equal((await handler(new Request('https://example.test/api/receipts',{method:'POST',body:JSON.stringify({action})}))).status,400);
  }
});

test('adult count determines the saved fee, proof, and receipt total', async () => {
  for (const count of [1,2,3,6]) {
    const store = memoryStore();
    const saved = await submitApplication(store,{applicationId:'COUNT-'+count,adultApplicants:count,application_fee:1});
    assert.equal(saved.application_fee,count*70);
    const record=await getApplicationByToken(store,{token:saved.access_token});
    assert.equal(record.adult_applicants,count);
    assert.equal(record.receipt_amount,count*70);
    await submitPaymentProof(store,{token:saved.access_token,screenshotUrl:'https://example.test/proof.png'});
    process.env.OWNER_PASSWORD='correct-horse';
    const queue=await ownerListProofs(store,{password:'correct-horse'});
    assert.equal(queue[0].application_fee,count*70);
    const retry=await submitApplication(store,{applicationId:'COUNT-'+count,adultApplicants:99});
    assert.equal(retry.application_fee,count*70);
  }
});

test('invalid adult counts cannot create an application', async () => {
  for(const count of [0,-1,1.5,'5+','',1429]) {
    await assert.rejects(()=>submitApplication(memoryStore(),{applicationId:'INVALID',adultApplicants:count}),/valid number of adult/);
  }
});
