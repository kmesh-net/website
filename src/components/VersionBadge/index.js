import React from "react";
import useDocusaurusContext from "@docusaurus/useDocusaurusContext";
import styles from "./styles.module.css";

export default function VersionBadge() {
  const { siteConfig } = useDocusaurusContext();
  const version = siteConfig.customFields?.kmeshVersion;

  if (!version) {
    return null;
  }

  return (
    <a
      className={styles.versionBadge}
      href="https://github.com/kmesh-net/kmesh/releases"
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`Kmesh version ${version}`}
      title={`Kmesh ${version}`}
    >
      <span className={styles.dot} aria-hidden="true" />
      <span className={styles.label}>{version}</span>
    </a>
  );
}
