import axios from "axios";
import { useRouter } from "next/router";
import { useContext, useState } from "react";
import { AuthContext, ThemeContext } from "../context";
import { API_URL } from "../utils";

export const useAxios = () => {
  const { setUser, userValue, userStorage } = useContext(AuthContext);
  const { themeStorage } = useContext(ThemeContext);
  const router = useRouter();

  const instance = axios.create({
    baseURL: API_URL,
    headers: {
      "Content-Type": "application/json",
    },
  });

  let isRefreshingToken = false;
  let failedRequests = [];

  const addFailedRequest = (error) => {
    return new Promise((resolve, reject) => {
      failedRequests.push({ error, resolve, reject });
    });
  };

  const processFailedRequests = (token) => {
    failedRequests.forEach((request) => {
      const { error, resolve, reject } = request;
      error.config.headers.Authorization = `Bearer ${token}`;
      instance(error.config)
        .then((response) => {
          resolve(response);
        })
        .catch((error) => {
          reject(error);
        });
    });
    failedRequests = [];
  };

  const refreshAccessToken = async () => {
    try {
      const { data: usr } = await axios.post(`${API_URL}/api/RefreshToken`, {
        refreshToken: refreshToken?.toString(),
      });
      themeStorage.set(usr.data.user.theme);
      accessToken = usr.data.token.accessToken;
      refreshToken = usr.data.token.refreshToken;
      userStorage.set(JSON.stringify(usr.data));
      setUser({
        details: usr.data.user,
        availableAccess: usr.data.availableAccess || null,
      });
      isRefreshingToken = false;
      processFailedRequests(accessToken);
      return accessToken;
    } catch (error) {
      setUser(null);
      userStorage.del();
      router.push("/auth/login");
      throw error;
    }
  };

  let accessToken = userValue ? JSON.parse(userValue).token?.accessToken : null;
  let refreshToken = userValue
    ? JSON.parse(userValue).token?.refreshToken
    : null;

  instance.interceptors.request.use(
    (config) => {
      if (accessToken) {
        config.headers["Authorization"] = `Bearer ${accessToken}`;
      }
      return config;
    },
    (error) => {
      return Promise.reject(error);
    }
  );

  instance.interceptors.response.use(
    (res) => {
      return res;
    },
    async (error) => {
      const { config, response } = error;
      if (response?.status === 401) {
        if (!isRefreshingToken) {
          isRefreshingToken = true;
          try {
            const newAccessToken = await refreshAccessToken();
            config.headers.Authorization = `Bearer ${newAccessToken}`;
            return instance(config);
          } catch (error) {
            return Promise.reject(error);
          }
        } else {
          try {
            const response = await addFailedRequest(error);
            return response;
          } catch (error) {
            return Promise.reject(error);
          }
        }
      }
      return Promise.reject(error);
    }

  );

  return instance;
};
