import React from "react";
import Link from "@docusaurus/Link";
import Translate from "@docusaurus/Translate";
import styles from "./styles.module.css";

export default function NotFoundContent({ className }) {
  return (
    <main className={className}>
      <div className={styles.pageWrapper}>
        <div className={styles.notFoundContainer}>
          <div className={styles.content}>
            <h1 className={styles.title}>
              <Translate
                id="theme.NotFound.title"
                description="The title of the 404 page"
              >
                Page Not Found
              </Translate>
            </h1>
            <p className={styles.subtitle}>
              <Translate
                id="theme.NotFound.p1"
                description="The first paragraph of the 404 page"
              >
                We could not find what you were looking for.
              </Translate>
            </p>

            <div className={styles.messageBox}>
              <div className={styles.infoIcon}>
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"
                    fill="currentColor"
                  />
                </svg>
              </div>
              <div>
                <p className={styles.message}>
                  <Translate
                    id="theme.NotFound.p2"
                    description="The 2nd paragraph of the 404 page"
                  >
                    Please contact the owner of the site that linked you to the
                    original URL and let them know their link is broken.
                  </Translate>
                </p>
              </div>
            </div>

            <div className={styles.actions}>
              <Link to="/" className={styles.primaryButton}>
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"
                    fill="currentColor"
                  />
                </svg>
                <Translate>Return Home</Translate>
              </Link>
              <Link to="/docs/welcome" className={styles.secondaryButton}>
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"
                    fill="currentColor"
                  />
                </svg>
                <Translate>View Documentation</Translate>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
