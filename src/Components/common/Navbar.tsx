import React, { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { HashLink as BetterLink } from "react-router-hash-link";
import { rem, Button, Modal } from "@mantine/core";
import { IconWallet } from "@tabler/icons-react";
import { logo, menu } from "../../assets";
import { navLinks } from "../../constants";
import { useWallet } from "../../web3/index";
import { useDisclosure } from "@mantine/hooks";
import { StellarProfileModal } from "./Profile";

/**
 * Navbar Component
 * Provides navigation and wallet connection functionality
 * Includes responsive design for mobile devices
 */
const Navbar: React.FC = () => {
  // Hooks
  const location = useLocation();

  // State
  const [active, setActive] = useState("");
  const [toggle, setToggle] = useState(false);

  const [opened, { open: openModal, close }] = useDisclosure(false);

  // Update active link based on current location
  useEffect(() => {
    setActive(location.pathname);
  }, [location]);

  const { connect, connected, walletAddress } = useWallet();
  const handleConnectWallet = () => {};
  const handleClickConnect = () => {
    if (connected) openModal();
    else connect(handleConnectWallet);
  };

  /**
   * Formats the wallet address for display
   * @param address - The full wallet address
   * @returns Shortened address with ellipsis
   */
  const formatAddress = (address: string) => {
    return `${address.slice(0, 4)}...${address.slice(-6)}`;
  };

  return (
    <nav className=" w-full flex py-6 justify-between items-center navbar">
      <Modal opened={opened} onClose={close} radius={rem(20)} centered>
        <StellarProfileModal
          version={"testnet"}
          address={walletAddress}
          close={close}
        />
      </Modal>
      {/* Logo */}
      <Link to="/">
        <img src={logo} alt="Siborg logo" className="" />
      </Link>

      {/* Desktop Navigation */}
      <ul className="list-none sm:flex hidden justify-center items-center flex-1">
        {navLinks.map((nav) => (
          <BetterLink
            key={nav.id}
            to={nav.id}
            className="font-poppins font-normal cursor-pointer text-[20px] mr-10 text-white"
          >
            {nav.title}
          </BetterLink>
        ))}
      </ul>

      {/* Wallet Connection Button */}
      <Button
        leftIcon={<IconWallet />}
        variant="white"
        className="py-2 px-6 font-poppins font-medium text-[18px] text-white bg-secondary rounded-[10px] outline-none"
        onClick={handleClickConnect}
      >
        {walletAddress
          ? `${walletAddress?.slice(0, 6)}...${walletAddress?.slice(-6)}`
          : "Connect"}
      </Button>

      {/* Mobile Navigation */}
      <div className="sm:hidden inset-y-10 left-0">
        <img
          src={toggle ? close : menu}
          alt="menu"
          className="w-[28px] h-[28px] object-contain"
          onClick={handleClickConnect}
        />
        <div
          className={`${
            !toggle ? "hidden" : "flex"
          } p-6 bg-black-gradient absolute top-20 right-0 mx-4 my-2 min-w-[140px] rounded-xl sidebar`}
        >
          <ul className="list-none flex justify-end items-start flex-1 flex-col">
            {navLinks.map((nav) => (
              <div
                key={nav.id}
                className="w-full flex justify-between items-center md:flex-row flex-col pb-2 border-t-[2px] border-t-[#3F3E45]"
              >
                <BetterLink
                  to={nav.id}
                  className={`font-poppins font-normal cursor-pointer text-[18px] mt-4 text-white ${
                    active === nav.id
                      ? "bg-secondary rounded-[10px] pr-2 pl-2"
                      : ""
                  }`}
                >
                  {nav.title}
                </BetterLink>
              </div>
            ))}
          </ul>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
