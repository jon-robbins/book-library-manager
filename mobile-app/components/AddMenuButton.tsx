import { useState } from "react";
import { TouchableOpacity, Text, View, StyleSheet, Modal, Pressable } from "react-native";
import { useRouter } from "expo-router";

export default function AddMenuButton() {
  const [visible, setVisible] = useState(false);
  const router = useRouter();

  const openScan = () => {
    setVisible(false);
    router.push("/scan");
  };

  const openManualEntry = () => {
    setVisible(false);
    router.push("/add");
  };

  return (
    <>
      <TouchableOpacity
        onPress={() => setVisible(true)}
        style={styles.trigger}
        hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
      >
        <Text style={styles.triggerText}>+</Text>
      </TouchableOpacity>
      <Modal
        visible={visible}
        transparent
        animationType="fade"
        onRequestClose={() => setVisible(false)}
      >
        <Pressable style={styles.backdrop} onPress={() => setVisible(false)}>
          <View style={styles.menu} onStartShouldSetResponder={() => true}>
            <Pressable style={styles.menuItem} onPress={openScan}>
              <Text style={styles.menuItemText}>Scan Barcode</Text>
            </Pressable>
            <Pressable style={styles.menuItem} onPress={openManualEntry}>
              <Text style={styles.menuItemText}>Manual entry</Text>
            </Pressable>
          </View>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  trigger: {
    marginRight: 12,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#007AFF",
    justifyContent: "center",
    alignItems: "center",
  },
  triggerText: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "600",
    lineHeight: 24,
  },
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.3)",
    alignItems: "flex-end",
    paddingTop: 56,
    paddingRight: 12,
  },
  menu: {
    backgroundColor: "#fff",
    borderRadius: 10,
    minWidth: 180,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  menuItem: {
    paddingVertical: 14,
    paddingHorizontal: 18,
  },
  menuItemText: {
    fontSize: 16,
    color: "#111",
  },
});
