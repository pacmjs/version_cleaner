import { charactersToReplaceInVersion } from "";
import { getLatestVersion, getLatestVersionForRange } from "./getLatestVersion.js";
import chalk from "chalk";
import semver from "semver";

export const cleanVersion = async (version: string, peerDependencies?: { [key: string]: string }) => {
  if (charactersToReplaceInVersion.includes(version[0])) {
    version = version.slice(1);
  }

  if (version === "*") {
    return "latest";
  }

  if (version.endsWith(".x")) {
    const majorVersion = version.split(".")[0];
    try {
      const latestVersion = await getLatestVersion(majorVersion);
      return latestVersion;
    } catch (error: any) {
      console.error(chalk.red(`Failed to get the latest version for ${version}:`), error.message);
      return version.replace(".x", "");
    }
  }

  if (/^[><=^~]/.test(version)) {
    try {
      const [packageName, range] = version.split(/(?<=^\S+)\s/);
      const latestVersion = await getLatestVersionForRange(packageName, range);
      return latestVersion;
    } catch (error: any) {
      console.error(chalk.red(`Failed to get the latest version for range ${version}:`), error.message);
      return "latest";
    }
  }

  if (peerDependencies) {
    const peerDepVersion = peerDependencies[version];
    if (peerDepVersion) {
      return peerDepVersion;
    }
  }

  if (!semver.valid(version)) {
    try {
      const latestVersion = await getLatestVersion(version);
      return latestVersion;
    } catch (error: any) {
      console.error(chalk.red(`Failed to get the latest version for invalid version format ${version}:`), error.message);
      return "latest";
    }
  }

  return version;
};