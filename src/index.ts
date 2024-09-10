import axios from 'axios';
import semver from 'semver';
// @ts-ignore
import { validateVersion } from '../latest_version/index.js';

interface NpmRegistryResponse {
    'dist-tags': {
        latest: string;
    };
    versions: {
        [version: string]: any;
    };
}

const cleanVersion = async (packageName: string, version: string): Promise<string> => {
    if (!semver.valid(version)) {
        throw new Error(`Invalid version format: ${version}`);
    }

    try {
        await validateVersion(packageName, version);
        return version;
    } catch (error: any) {
        if (error.response && error.response.status === 404) {
            console.log(`Version ${version} does not exist for package ${packageName}. Using latest compatible version instead.`);
            const { data } = await axios.get<NpmRegistryResponse>(`https://registry.npmjs.org/${packageName}`);
            const versions = Object.keys(data.versions);
            const latestCompatibleVersion = semver.maxSatisfying(versions, `<=${version}`);
            return latestCompatibleVersion || data['dist-tags'].latest;
        } else {
            throw new Error(`Failed to validate version ${version} for package ${packageName}: ${error.message}`);
        }
    }
};

export {
    cleanVersion,
};