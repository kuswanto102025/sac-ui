"use client";

import { useState } from "react";
import { ArrowLeftRight, Check, ClipboardCopy, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Toaster } from "@/components/ui/toaster";
import { useToast } from "@/components/ui/use-toast";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ReloadIcon } from "@radix-ui/react-icons";

export interface EligibilityResponse {
  address: string;
  eligibility: Eligibility[];
  error: string | null;
}
export interface Eligibility {
  protocol: string;
  protocolLabel: string;
  token: string;
  ticker: string;
  eligible: boolean;
  amount: number;
  note: string;
}

export default function IndexPage() {
  const { toast } = useToast();
  const [addresses, setAddresses] = useState<string[]>([]);
  const [eligibility, setEligibility] = useState<{
    address: string;
    jupiterEligible: boolean;
    jupiterVolume: number;
    jupiterNote: string;
    pythEligible: boolean;
    pythPoints: number;
    pythNote: string;
  }[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  function processAddresses(addresses: string) {
     // input can be comma separated or newline separated
     if (addresses === "") {
      setAddresses([]);
      return;
    }

    if (addresses.includes(",")) {
      setAddresses(addresses.split(","));
    }

    if (addresses.includes("\n")) {
      setAddresses(addresses.split("\n"));
    }
  }

  async function fetchData(address: string): Promise<EligibilityResponse> {
    try {
        const response = await fetch(`https://sac-api.solworks.dev/${address}`);
        const data = (await response.json()) as EligibilityResponse;
        return data;
    } catch (error: any) {
        console.error(`Error fetching data for address ${address}:`, error);
        return {
            address,
            eligibility: [],
            error: error.message,
        }
    }
  }

  async function fetchDataForAddresses(addresses: string[]) {
      const batchSize = 10;
      const results: { 
        address: string;
        jupiterEligible: boolean;
        jupiterVolume: number;
        jupiterNote: string;
        pythEligible: boolean;
        pythPoints: number;
        pythNote: string;
      }[] = [];

      for (let i = 0; i < addresses.length; i += batchSize) {
        const batch = addresses.slice(i, i + batchSize);
        const batchResults = await Promise.all(batch.map(async (address) => {
            const data = await fetchData(address);
            const pythEligible = data.eligibility.find((e) => e.protocol === 'pyth');
            const jupiterEligible = data.eligibility.find((e) => e.protocol === 'jupiter');
            const pythPoints = pythEligible ? pythEligible.amount : 0;
            const jupiterVolume = jupiterEligible ? jupiterEligible.amount : 0;
            
            return {
              address,
              jupiterEligible: jupiterEligible ? jupiterEligible.eligible : false,
              jupiterVolume,
              jupiterNote: jupiterEligible ? jupiterEligible.note : '',
              pythEligible: pythEligible ? pythEligible.eligible : false,
              pythPoints,
              pythNote: pythEligible ? pythEligible.note : '',
            }
        }));
        results.push(...batchResults);
      }

      return results;
  }

  return (
    <section className="container grid items-center gap-6 pb-8 pt-6 md:py-10">
      <div className="flex max-w-[980px] flex-col items-start gap-2">
        <p className="max-w-[700px] text-lg text-muted-foreground">
          Check eligibility for different Solana airdrops 🔍
        </p>
        <h1 className="text-3xl font-extrabold leading-tight tracking-tighter md:text-4xl">
          Solana Airdrop Checker
        </h1>
      </div>
      <Separator />
      <div className="grid w-full gap-2">
        <div className="grid w-full gap-0">
          <h1 className="text-2xl font-extrabold leading-tight tracking-tighter md:text-2xl">
            Enter addresses
          </h1>
          <div className="max-w-[700px] text-lg">
            <div className="inline-block pr-4 text-base text-muted-foreground">
              Enter addresses to check eligibility. One address per line.
            </div>
          </div>
        </div>
        <div className="flex items-center justify-start space-x-4 pt-2">
          <Textarea
            placeholder="Paste address here."
            onChange={(e) => {
              processAddresses(e.target.value);
            }}
            value={addresses.join("\n")}
            className="h-[300px]"
          />
        </div>
        <div className="flex items-center justify-start space-x-4 pt-2">
          <Button
            variant="outline"
            onClick={async () => {
              const clipboard = await navigator.clipboard.readText();
              processAddresses(clipboard);
            }}
          >
            <ClipboardCopy className="mr-2 h-4 w-4" /> Paste
          </Button>
          <Button
            variant="outline"
            onClick={async () => {
              setAddresses([]);
            }}
          >
            <X className="mr-2 h-4 w-4" /> Clear
          </Button>
          <Button
            variant="default"
            onClick={async () => {
              try {
                setLoading(true);
                toast({
                  title: "Fetching data...",
                  description: `Checking ${addresses.length} addresses`,
                  duration: 5000,
                }); 
                setEligibility([]);
                const results = await fetchDataForAddresses(addresses);
                setEligibility(results);
                toast({
                  title: "Success",
                  description: `Successfully checked ${addresses.length} addresses.`,
                  duration: 5000,
                })
              } catch (e: any) {
                console.log(e);
                toast({
                  title: "Error",
                  description: `${e.message}`,
                  duration: 5000,
                  variant: 'destructive'
                })
              }
              setLoading(false);
            }}
            disabled={loading}
          >
            {loading && <><ReloadIcon className="mr-2 h-4 w-4 animate-spin"/> Checking...</>}
            {!loading && <><ArrowLeftRight className="mr-2 h-4 w-4" /> Check</>}
          </Button>
        </div>
      </div>
      <div className="grid w-full gap-2">
        <div className="grid w-full gap-0">
          <h1 className="text-2xl font-extrabold leading-tight tracking-tighter md:text-2xl">
            Eligibility
          </h1>
          <div className="max-w-[700px] text-base text-muted-foreground">
            <div className="inline-block pr-4">
              View eligibility for each address here.
            </div>
          </div>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[100px]"></TableHead>
              <TableHead>Address</TableHead>
              <TableHead>Eligible for Jupiter</TableHead>
              <TableHead>Jupiter Volume</TableHead>
              <TableHead>Eligible for Pyth</TableHead>
              <TableHead>Pyth Points</TableHead>
              <TableHead className="text-right">Eligible for any</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {eligibility.map((e) => {
              return (
                <TableRow key={e.address}>
                  <TableCell className="font-medium">{eligibility.indexOf(e) + 1}</TableCell>
                  <TableCell className="font-medium">{e.address}</TableCell>
                  <TableCell>{e.jupiterEligible ? '✅' : '❌'}</TableCell>
                  <TableCell>{e.jupiterVolume.toLocaleString(undefined, {
                    maximumFractionDigits: 2,
                    minimumFractionDigits: 2,
                  })}</TableCell>
                  {/* <TableCell>{e.jupiterNote}</TableCell> */}
                  <TableCell>{e.pythEligible ? '✅' : '❌'}</TableCell>
                  <TableCell>{e.pythPoints}</TableCell>
                  <TableCell className="text-right">{e.jupiterEligible || e.pythEligible ? '✅' : '❌'}</TableCell>
                </TableRow>
              )
            })}
            {/* sum row */}
            <TableRow>
              <TableCell className="font-medium">Total</TableCell>
              <TableCell className="font-medium"></TableCell>
              <TableCell></TableCell>
              <TableCell>{eligibility.reduce((a, b) => a + b.jupiterVolume, 0).toLocaleString(undefined, {
                    maximumFractionDigits: 2,
                    minimumFractionDigits: 2,
                  })}</TableCell>
              <TableCell></TableCell>
              <TableCell>{eligibility.reduce((a, b) => a + b.pythPoints, 0)}</TableCell>
              <TableCell className="text-right"></TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>
      <Toaster />
    </section>
  )
}