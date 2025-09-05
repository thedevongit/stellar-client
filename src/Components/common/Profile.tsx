import React from "react";
import { Button, Flex } from "@mantine/core";
import { IconExternalLink, IconPlugConnectedX } from "@tabler/icons-react";
import {stellarIcon} from "../../assets/index";
import { useWallet } from "../../web3/index";
import { ProfileAvatar } from "./Avatar";
import { useBalance } from "../../hooks/common/useBalance";


interface ProfileModalProps {
  version:string,
  address: string;
  close: () => void;
}

const StellarIcon: React.FC = () => (
  <img src={stellarIcon} alt="Stellar" style={{ width: "1.2rem" }} />
);

export const StellarProfileModal: React.FC<ProfileModalProps> = ({
    version,
  address,
  close,
}) => {
  const { disconnect, walletAddress } = useWallet();
  const handleDisconnectClick = async () => {
    disconnect();
    close();
  };
  const {data} = useBalance(version, walletAddress);
  
  const WalletIcon = StellarIcon;
  const networkUrl =
    version == "testnet"
      ? process.env.STELLAR_TESTNET_EXPLORER + "accounts/" + address
      : process.env.STELLAR_MAINNET_EXPLORER + "accounts/" + address;
  return (
    // <Modal isOpen={isOpen} onClose={closeIt} modalRadius={40}>
    <Flex mih={50} gap="md" justify="center" align="center" direction="column">
      <ProfileAvatar address={address} balance={data} />
      <Button
        variant="default"
        color="gray"
        style={{ justifyContent: "space-between" }}
        w={300}
        leftIcon={<WalletIcon />}
        rightIcon={<IconExternalLink size="1.2rem" />}
        onClick={() => window.open(`${networkUrl}/${address}`)}
      >
        Block Explorer
      </Button>
      <Button
        variant="default"
        color="gray"
        style={{ justifyContent: "space-between" }}
        w={300}
        leftIcon={<WalletIcon />}
        rightIcon={<IconPlugConnectedX size="1.2rem" />}
        onClick={() => handleDisconnectClick()}
      >
        Disconnect
      </Button>
    </Flex>
    // </Modal>
  );
};
