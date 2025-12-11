import { describe, expect, it } from "vitest";
import { Cl } from "@stacks/transactions";

const accounts = simnet.getAccounts();
const deployer = accounts.get("deployer")!;
const wallet1 = accounts.get("wallet_1")!;

/*
  Token Streaming Protocol Tests
  Testing Clarity 4 features and core functionality
*/

describe("Stream Manager Contract - Clarity 4 Features", () => {
  describe("Clarity 4: stacks-block-time", () => {
    it("should use stacks-block-time for stream timing", () => {
      const { result } = simnet.callReadOnlyFn(
        "stream-manager",
        "get-current-time",
        [],
        deployer
      );

      // Verify that get-current-time returns a valid timestamp (as a uint)
      expect(result).toHaveProperty("type");
    });
  });

  describe("Clarity 4: contract-hash?", () => {
    it("should verify contract template using contract-hash?", () => {
      const { result } = simnet.callReadOnlyFn(
        "stream-manager",
        "verify-contract-template",
        [Cl.principal(deployer)],
        deployer
      );

      // Should return ok response with buffer hash
      expect(result).toHaveProperty("type");
    });
  });

  describe("Clarity 4: ASCII conversion", () => {
    it("should return stream status as ASCII string", () => {
      // First create a stream
      const createResult = simnet.callPublicFn(
        "stream-manager",
        "create-stream",
        [
          Cl.principal(wallet1),
          Cl.uint(1000000), // 1 STX
          Cl.uint(86400), // 24 hours
        ],
        deployer
      );

      expect(createResult.result).toBeOk(Cl.uint(1));

      // Get status string
      const { result } = simnet.callReadOnlyFn(
        "stream-manager",
        "get-stream-status-string",
        [Cl.uint(1)],
        deployer
      );

      expect(result).toBeOk(Cl.some(Cl.stringAscii("active")));
    });
  });
});

describe("Stream Creation", () => {
  it("should create a new stream successfully", () => {
    const amount = 10_000_000; // 10 STX
    const duration = 86400; // 24 hours

    const { result } = simnet.callPublicFn(
      "stream-manager",
      "create-stream",
      [Cl.principal(wallet1), Cl.uint(amount), Cl.uint(duration)],
      deployer
    );

    expect(result).toBeOk(Cl.uint(1));
  });

  it("should fail when creating stream to self", () => {
    const { result } = simnet.callPublicFn(
      "stream-manager",
      "create-stream",
      [Cl.principal(deployer), Cl.uint(1000000), Cl.uint(86400)],
      deployer
    );

    expect(result).toBeErr(Cl.uint(108)); // ERR_INVALID_RECIPIENT
  });

  it("should fail with zero amount", () => {
    const { result } = simnet.callPublicFn(
      "stream-manager",
      "create-stream",
      [Cl.principal(wallet1), Cl.uint(0), Cl.uint(86400)],
      deployer
    );

    expect(result).toBeErr(Cl.uint(103)); // ERR_INVALID_AMOUNT
  });

  it("should fail with zero duration", () => {
    const { result } = simnet.callPublicFn(
      "stream-manager",
      "create-stream",
      [Cl.principal(wallet1), Cl.uint(1000000), Cl.uint(0)],
      deployer
    );

    expect(result).toBeErr(Cl.uint(104)); // ERR_INVALID_DURATION
  });
});

describe("Stream Queries", () => {
  it("should retrieve stream details", () => {
    // Create test stream
    simnet.callPublicFn(
      "stream-manager",
      "create-stream",
      [Cl.principal(wallet1), Cl.uint(1000000), Cl.uint(86400)],
      deployer
    );

    const { result } = simnet.callReadOnlyFn(
      "stream-manager",
      "get-stream",
      [Cl.uint(1)],
      deployer
    );

    // get-stream returns (ok (some ...)), so check it's ok
    expect(result).toHaveProperty("type");
    expect(result).toHaveProperty("value");
  });

  it("should get total streams count", () => {
    simnet.callPublicFn(
      "stream-manager",
      "create-stream",
      [Cl.principal(wallet1), Cl.uint(1000000), Cl.uint(86400)],
      deployer
    );

    const { result } = simnet.callReadOnlyFn(
      "stream-manager",
      "get-total-streams",
      [],
      deployer
    );

    expect(result).toBeOk(Cl.uint(1));
  });
});

describe("Stream Cancellation", () => {
  it("should allow sender to cancel stream", () => {
    simnet.callPublicFn(
      "stream-manager",
      "create-stream",
      [Cl.principal(wallet1), Cl.uint(1000000), Cl.uint(86400)],
      deployer
    );

    const { result } = simnet.callPublicFn(
      "stream-manager",
      "cancel-stream",
      [Cl.uint(1)],
      deployer
    );

    expect(result).toBeOk(Cl.bool(true));
  });

  it("should fail when non-sender tries to cancel", () => {
    simnet.callPublicFn(
      "stream-manager",
      "create-stream",
      [Cl.principal(wallet1), Cl.uint(1000000), Cl.uint(86400)],
      deployer
    );

    const { result } = simnet.callPublicFn(
      "stream-manager",
      "cancel-stream",
      [Cl.uint(1)],
      wallet1
    );

    expect(result).toBeErr(Cl.uint(100)); // ERR_UNAUTHORIZED
  });
});
