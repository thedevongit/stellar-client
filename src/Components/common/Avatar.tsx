import {
  Group,
  Center,
  CopyButton,
  ActionIcon,
  Tooltip,
  rem,
  Avatar,
  Text,
  Flex,
} from "@mantine/core";
import { IconCopy, IconCheck } from "@tabler/icons-react";
import {siborg} from "../../assets/index";
import React from "react";
interface AvatarProps {
  address: string;
  balance: number;
}

export const ProfileAvatar: React.FC<AvatarProps> = ({ address, balance }) => (
  <>
    {/* With image */}
    <Flex mih={50} gap="md" justify="center" align="center" direction="column">
      <Avatar src={siborg} radius="xl" alt="it's me" size={60} />
      <Group>
        <Center>
          <Text fw={700} size="xl">
            {address?.slice(0, 6)}...{address?.slice(-6)}
          </Text>
        </Center>
        <CopyButton value={address} timeout={1000}>
          {({ copied, copy }) => (
            <Tooltip
              label={copied ? "Copied" : "Copy"}
              withArrow
              position="right"
            >
              <ActionIcon
                color={copied ? "teal" : "gray"}
                variant="subtle"
                onClick={copy}
              >
                {copied ? (
                  <IconCheck style={{ width: rem(16) }} />
                ) : (
                  <IconCopy style={{ width: rem(16) }} />
                )}
              </ActionIcon>
            </Tooltip>
          )}
        </CopyButton>
      </Group>
      {Number(balance)} XLM
    </Flex>
  </>
);
