import React from "react";
import SectionContainer from "../sectionContainer";
import Translate from "@docusaurus/Translate";
import Link from "@docusaurus/Link";
import useDocusaurusContext from "@docusaurus/useDocusaurusContext";
import ThemedImage from "@theme/ThemedImage";
import useBaseUrl from "@docusaurus/useBaseUrl";
import "./index.scss";

const supportList = [
  {
    name: "HuaweiCloud",
    img_src: "img/supporters/huawei.svg",
    img_src_dark: "img/supporters/huawei-dark.svg",
    external_link: "https://www.huaweicloud.com/",
  },

  {
    name: "OpenEuler",
    img_src: "img/supporters/openEuler.svg",
    img_src_dark: "img/supporters/openEuler-dark.svg",
    external_link: "https://www.openeuler.org/",
  },
];

export default function Supporters() {
  const { i18n } = useDocusaurusContext();
  return (
    <SectionContainer className={"supporterContainer"}>
      <div className={"supporters"}>
        <h1>
            <span className={"joins"}>
              <Translate>Supporters </Translate>
            </span>         
        </h1>
      </div>
      <div className={"supporterBoxContainer"}>
        {supportList.map((item, index) => (
          <div key={index} className="supporterBox">
            <div className="imgContainer">
              <Link to={item.external_link}>
                <ThemedImage
                  alt={item.name}
                  sources={{
                    light: useBaseUrl(item.img_src),
                    dark: useBaseUrl(item.img_src_dark || item.img_src),
                  }}
                />
              </Link>
            </div>
          </div>
        ))}
      </div>
    </SectionContainer>
  );
}
