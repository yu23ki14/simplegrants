import { PaymentAccount, PaymentProvider } from "@prisma/client";
import { Contribution } from "./contributions";
import { User } from "./user";

export interface BasicGrantInfo {
  id: string;
  name: string;
  image: string;
}

export interface BasicGrantResponse {
  id: string;
  name: string;
  description: string;
  image: string;
  twitter: string;
  website: string;
  location: string;
  fundingGoal: number;
  verified: boolean;
}
export interface GrantResponse extends BasicGrantResponse {
  amountRaised: number;
  contributions: Contribution[];
  team: User[];
}

export interface GrantResponseWithContributions extends BasicGrantResponse {
  amountRaised: number;
  contributions: Contribution[];
}

export interface GrantDetailResponse extends GrantResponse {
  team: User[];
  contributions: Contribution[];
  paymentAccount: PaymentAccount & {
    provider: PaymentProvider;
  };
}

export interface PoolGrantResponse {
  id: string;
  name: string;
  description: string;
  image: string;
  fundingGoal: number;
  verified: boolean;
  amountRaised: number;
}

export const SortOptions = [
  {
    label: "新しいものから",
    value: "newest",
  },
  {
    label: "古いものから",
    value: "oldest",
  },
  {
    label: "寄付額",
    value: "most_funded",
  },
  {
    label: "支持者数",
    value: "most_backed",
  },
];

export const FilterOptions = [
  {
    label: "寄付済み",
    value: "funded",
  },
  {
    label: "未寄付",
    value: "underfunded",
  },
];
