import { useRouter } from "expo-router";
import ScanScreenContent from "@/components/ScanScreenContent";

export default function ScanScreen() {
  const router = useRouter();
  return <ScanScreenContent onAdded={() => router.back()} />;
}
