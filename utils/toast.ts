import Toast from "react-native-toast-message";

export const toastSuccess = (text1: string, text2?: string) =>
  Toast.show({ type: "success", text1, text2, position: "top" });

export const toastError = (text1: string, text2?: string) =>
  Toast.show({ type: "error", text1, text2, position: "top" });

export const toastInfo = (text1: string, text2?: string) =>
  Toast.show({ type: "info", text1, text2, position: "top" });