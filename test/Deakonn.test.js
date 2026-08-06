const { expect } = require("chai");
const { ethers } = require("hardhat");

async function expectRevert(promise) {
  try {
    await promise;
    expect.fail("Expected transaction to revert");
  } catch (error) {
    expect(error).to.exist;
  }
}

describe("Deakonn", function () {
  const INITIAL_SUPPLY = 1_000_000_000n * 10n ** 18n;

  async function deployFixture() {
    const [admin, alice, bob] = await ethers.getSigners();
    const Deakonn = await ethers.getContractFactory("Deakonn");
    const token = await Deakonn.deploy(admin.address);
    await token.waitForDeployment();
    return { token, admin, alice, bob };
  }

  describe("deployment", function () {
    it("sets metadata and mints initial supply to admin", async function () {
      const { token, admin } = await deployFixture();

      expect(await token.name()).to.equal("Deakonn");
      expect(await token.symbol()).to.equal("DEAK");
      expect(await token.decimals()).to.equal(18n);
      expect(await token.totalSupply()).to.equal(INITIAL_SUPPLY);
      expect(await token.balanceOf(admin.address)).to.equal(INITIAL_SUPPLY);
    });

    it("grants all roles to admin", async function () {
      const { token, admin } = await deployFixture();

      const DEFAULT_ADMIN_ROLE = await token.DEFAULT_ADMIN_ROLE();
      const MINTER_ROLE = await token.MINTER_ROLE();
      const BURNER_ROLE = await token.BURNER_ROLE();
      const PAUSER_ROLE = await token.PAUSER_ROLE();

      expect(await token.hasRole(DEFAULT_ADMIN_ROLE, admin.address)).to.be.true;
      expect(await token.hasRole(MINTER_ROLE, admin.address)).to.be.true;
      expect(await token.hasRole(BURNER_ROLE, admin.address)).to.be.true;
      expect(await token.hasRole(PAUSER_ROLE, admin.address)).to.be.true;
    });

    it("reverts when admin is zero address", async function () {
      const Deakonn = await ethers.getContractFactory("Deakonn");
      await expectRevert(Deakonn.deploy(ethers.ZeroAddress));
    });
  });

  describe("transfers", function () {
    it("supports standard transfer and transferFrom", async function () {
      const { token, admin, alice, bob } = await deployFixture();
      const amount = ethers.parseEther("100");

      await token.connect(admin).transfer(alice.address, amount);
      expect(await token.balanceOf(alice.address)).to.equal(amount);

      await token.connect(alice).approve(bob.address, amount);
      await token.connect(bob).transferFrom(alice.address, bob.address, amount);
      expect(await token.balanceOf(bob.address)).to.equal(amount);
    });
  });

  describe("minting", function () {
    it("allows minter to mint", async function () {
      const { token, admin, alice } = await deployFixture();
      const amount = ethers.parseEther("1000");

      await token.connect(admin).mint(alice.address, amount);

      expect(await token.balanceOf(alice.address)).to.equal(amount);
      expect(await token.totalSupply()).to.equal(INITIAL_SUPPLY + amount);
    });

    it("reverts when non-minter mints", async function () {
      const { token, alice } = await deployFixture();
      await expectRevert(token.connect(alice).mint(alice.address, 1n));
    });
  });

  describe("burning", function () {
    it("allows users to burn their own tokens", async function () {
      const { token, admin } = await deployFixture();
      const amount = ethers.parseEther("50");

      await token.connect(admin).burn(amount);
      expect(await token.balanceOf(admin.address)).to.equal(INITIAL_SUPPLY - amount);
      expect(await token.totalSupply()).to.equal(INITIAL_SUPPLY - amount);
    });

    it("allows burner role to adminBurn from any account", async function () {
      const { token, admin, alice } = await deployFixture();
      const amount = ethers.parseEther("25");

      await token.connect(admin).transfer(alice.address, amount);
      await token.connect(admin).adminBurn(alice.address, amount);

      expect(await token.balanceOf(alice.address)).to.equal(0n);
      expect(await token.totalSupply()).to.equal(INITIAL_SUPPLY - amount);
    });

    it("reverts when non-burner calls adminBurn", async function () {
      const { token, admin, alice } = await deployFixture();
      const amount = ethers.parseEther("10");

      await token.connect(admin).transfer(alice.address, amount);
      await expectRevert(
        token.connect(alice).adminBurn(alice.address, amount)
      );
    });
  });

  describe("pausing", function () {
    it("blocks transfers while paused and allows after unpause", async function () {
      const { token, admin, alice } = await deployFixture();
      const amount = ethers.parseEther("1");

      await token.connect(admin).pause();
      await expectRevert(
        token.connect(admin).transfer(alice.address, amount)
      );

      await token.connect(admin).unpause();
      await token.connect(admin).transfer(alice.address, amount);
      expect(await token.balanceOf(alice.address)).to.equal(amount);
    });

    it("reverts when non-pauser tries to pause", async function () {
      const { token, alice } = await deployFixture();
      await expectRevert(token.connect(alice).pause());
    });
  });
});
