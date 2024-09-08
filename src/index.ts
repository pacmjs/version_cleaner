// @ts-nocheck
import { charactersToReplaceInVersion } from "../constants/index.js";
import { getLatestVersion, getLatestVersionForRange } from "../latest_version/index.js";
import semver from "semver";

export const cleanVersion = async (
    packageName: string,
    version: string,
    peerDependencies?: { [key: string]: string },
) => {
    if (charactersToReplaceInVersion.includes(version[0])) {
        version = version.slice(1);
    }

    if (version === "*") {
        return "latest";
    }

    if (version.endsWith(".x")) {
        const majorVersion = version.split(".")[0];
        try {
            const res = await getLatestVersion(majorVersion);
            return res.latestVersion;
        } catch (error: any) {
            return version.replace(".x", "");
        }
    }

    if (/^[><=^~]/.test(version)) {
        try {
            const [packageName, range] = version.split(/(?<=^\S+)\s/);
            const res = await getLatestVersionForRange(packageName, range);
            return res.latestVersion;
        } catch (error: any) {
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
            return "latest";
        }
    }

    if (version == typeof null) {
        const res = await getLatestVersion(packageName);
        version = res.latestVersion;
    }

    return version;
};
