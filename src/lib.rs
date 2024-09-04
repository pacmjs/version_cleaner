use semver::Version;
use reqwest::Client;

pub async fn clean_version(version: &str) -> Result<String, Box<dyn std::error::Error>> {
    let characters_to_replace_in_version = vec!['^', '~', '>', '<', '='];
    let mut cleaned_version = version.to_string();

    if characters_to_replace_in_version.contains(&version.chars().next().unwrap()) {
        cleaned_version = cleaned_version[1..].to_string();
    }

    if cleaned_version == "*" {
        return Ok("latest".to_string());
    }

    if cleaned_version.ends_with(".x") {
        let major_version = cleaned_version.split('.').next().unwrap();
        let latest_version = get_latest_version(major_version).await?;
        return Ok(latest_version);
    }

    if cleaned_version.starts_with('>') || cleaned_version.starts_with('<') || cleaned_version.starts_with('=') {
        let latest_version = get_latest_version_for_range(&cleaned_version).await?;
        return Ok(latest_version);
    }

    if Version::parse(&cleaned_version).is_err() {
        let latest_version = get_latest_version(&cleaned_version).await?;
        return Ok(latest_version);
    }

    Ok(cleaned_version)
}

async fn get_latest_version(package_name: &str) -> Result<String, Box<dyn std::error::Error>> {
    let url = format!("https://registry.npmjs.org/{}/latest", package_name);
    let client = Client::new();
    let response = client.get(&url).send().await?.json::<serde_json::Value>().await?;
    let version = response["version"].as_str().unwrap().to_string();
    Ok(version)
}

async fn get_latest_version_for_range(range: &str) -> Result<String, Box<dyn std::error::Error>> {
    let package_name = range.split_whitespace().next().unwrap();
    let url = format!("https://registry.npmjs.org/{}", package_name);
    let client = Client::new();
    let response = client.get(&url).send().await?.json::<serde_json::Value>().await?;
    let versions = response["versions"].as_object().unwrap();
    let valid_versions: Vec<&String> = versions.keys().filter(|v| semver::Version::parse(v).is_ok()).collect();
    let latest_version = valid_versions.iter().max().unwrap().to_string();
    Ok(latest_version)
}