import React from "react";
import { usePluginData } from "@docusaurus/useGlobalData";
import SectionContainer from "../sectionContainer";
import Link from "@docusaurus/Link";
import Translate from "@docusaurus/Translate";
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import "./styles.scss";

export default function Blogs() {

    const { i18n: { currentLocale } } = useDocusaurusContext();

    const pluginData = usePluginData("blog-global-dataPlugin");
    const blogPosts = pluginData?.blogGlobalData?.blogPosts || [];

    return (
        <SectionContainer className="blogPostContainer">
            <div className="row">
                <div className="left">
                    <h1>
                        <Translate>Recent News</Translate>
                    </h1>
                    <Link to="/blog">
                        <Translate>View All</Translate>
                    </Link>
                </div>
                <div className="right">
                    {blogPosts.slice(0, 3).map((item) => (
                        <div key={item.metadata.permalink} className="viewBlogContainer">
                            <h3>
                                <Link to={item.metadata.permalink}>
                                    {item.metadata.title}
                                </Link>
                            </h3>
                            {item.metadata?.frontMatter?.summary && (
                                <p>{item.metadata?.frontMatter.summary}</p>
                            )}
                            <div className="info">
                                <div className="author">
                                    {(item.metadata?.authors || []).map(
                                        (author) => (
                                            <a key={author.url || author.name} href={author.url} target="_blank" rel="noopener noreferrer">
                                                {author.name}
                                            </a>
                                        )
                                    )}
                                </div>
                                <div className="update-time">
                                    <Translate>Last updated on</Translate>{" "}
                                    {new Date(
                                        item.metadata.date
                                    ).toLocaleDateString(currentLocale, {
                                        year: "numeric",
                                        month: "long",
                                        day: "numeric",
                                    })}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </SectionContainer>
    );
}

