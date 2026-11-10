import { readFile, readdir } from "node:fs/promises";
import { join, relative } from "node:path";
import { Snack, setSnackSDKFetch } from "snack-sdk";
import { sdks } from "snack-content";
import nodeFetch from "node-fetch";
import { HttpsProxyAgent } from "https-proxy-agent";

const proxyURL = process.env.HTTPS_PROXY || process.env.https_proxy;
if (proxyURL) {
  const proxyAgent = new HttpsProxyAgent(proxyURL);
  setSnackSDKFetch((url, options = {}) =>
    nodeFetch(url, { ...options, agent: proxyAgent }),
  );
}

// Snack's publishing SDK can lag behind Expo Go. Register the current Expo SDK
// locally; the Snack service itself already bundles SDK 58 dependencies.
sdks["58.0.0"] = {
  ...sdks["54.0.0"],
  version: "^58.0.0",
  coreModules: {
    ...sdks["54.0.0"].coreModules,
    expo: "~58.0.23",
    react: "19.3.0",
    "react-dom": "19.3.0",
    "react-native": "0.88.1",
  },
};

async function collectSourceFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const nested = await Promise.all(
    entries.map(async (entry) => {
      const path = join(directory, entry.name);
      if (entry.isDirectory()) return collectSourceFiles(path);
      return path.endsWith(".js") || path.endsWith(".json")
        ? [relative(".", path)]
        : [];
    }),
  );
  return nested.flat();
}

const paths = ["App.js", ...(await collectSourceFiles("src"))];

const files = Object.fromEntries(
  await Promise.all(
    paths.map(async (path) => [
      path,
      { type: "CODE", contents: await readFile(path, "utf8") },
    ]),
  ),
);

const snack = new Snack({
  name: "LingoSpark — английский играючи",
  description:
    "Игровые уроки английского: фразы, произношение, карточки, XP и достижения.",
  sdkVersion: "58.0.0",
  files,
  dependencies: {
    "@expo/vector-icons": { version: "^15.1.1" },
    "@react-native-async-storage/async-storage": { version: "2.2.0" },
    "expo-haptics": { version: "~58.0.7" },
    "expo-linear-gradient": { version: "~58.0.3" },
    "expo-speech": { version: "~58.0.3" },
    "expo-audio": { version: "~58.0.11" },
    "expo-clipboard": { version: "~58.0.4" },
    "js-base64": { version: "^3.7.8" },
    "react-native-safe-area-context": { version: "^5.11.1" },
  },
});

try {
  const result = await snack.saveAsync({ ignoreUser: true });
  console.log(JSON.stringify(result));
} finally {
  snack.setOnline(false);
}
