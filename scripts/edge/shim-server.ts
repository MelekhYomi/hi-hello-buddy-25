// Stand-in for "@tanstack/react-start/server".
import { requestStore } from "./shim-start";

export const getRequest = () => requestStore.getStore()?.request as Request;
