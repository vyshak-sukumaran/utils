import axios from "axios";
import { useContext } from "react";
import { AuthContext } from "../context";
import { API_URL } from "../utils/constants";
import jwtDecode from "jwt-decode";
import { useStorageSlot } from "../hooks";
import dayjs from "dayjs";

export const useAxios = () => {
  const { setUser } = useContext(AuthContext);
  let [currentValue, storageSlot] = useStorageSlot('authTokens')

  const axiosInstance = axios.create({
    baseURL: API_URL,
    headers: {
      "Content-Type": "application/json",
    },
  });

  axiosInstance.interceptors.request.use(async (config) => {
    let accessToken = JSON.parse(currentValue)?.accessToken;
    let exp = accessToken ? jwtDecode(accessToken)?.exp : null;

    let isExpired = dayjs.unix(exp).diff(dayjs()) < 300000 //5 minutes before expiry of token
    
    if (accessToken && !isExpired) {
      config.headers["Authorization"] = `Bearer ${accessToken}`;
      return config;
    }

    let refreshToken = JSON.parse(currentValue)?.refreshToken;
    let response = await axios.post(`${API_URL}/api/RefreshToken`, {
      refreshToken: String(refreshToken),
    }, { headers: {"Content-Type": "application/json"}})
    if (response.status === 200) {
      isExpired = false
      let authTokens = response.data.data.token;
      storageSlot.set(JSON.stringify(authTokens));
      setUser(jwtDecode(authTokens.accessToken));

      config.headers["Authorization"] = `Bearer ${authTokens.accessToken}`;

    } else if (response.status === 401) {
      logoutUser();
    } else {
      console.log("Something went wrong");
    }
    return config;
  });

  return axiosInstance;
};
