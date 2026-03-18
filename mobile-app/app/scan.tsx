import { useRouter } from "expo-router";
import ScanScreenContent from "@/components/ScanScreenContent";
import { LIBRARY_HOME } from "@/lib/routes";

export default function ScanScreen() {
  const router = useRouter();
  const goToLibrary = () => {
    router.dismissTo(LIBRARY_HOME as Parameters<typeof router.dismissTo>[0]);
  };
  return <ScanScreenContent onAdded={goToLibrary} />;
}
