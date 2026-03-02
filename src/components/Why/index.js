import React from "react";
import {
  Plug,
  Rocket,
  ArrowDown,
  ShieldCheck,
  Activity,
  Globe
} from "lucide-react";
import SectionContainer from "../sectionContainer";
import Translate from "@docusaurus/Translate";
import "./index.scss";

const reasons = [
  {
    title: <Translate>Smooth compatibility</Translate>,
    icon: Plug,
    content: (
      <>
        <Translate>Application-transparent Traffic Management.</Translate>
        <br />
        <Translate>
          Automatic Integration with Istio and other software
        </Translate>
      </>
    ),
  },
  {
    title: <Translate>High performance</Translate>,
    icon: Rocket,
    content: (
      <>
        <Translate>Forwarding latency 60%↓</Translate>
        <br />
        <Translate>Service startup performance 40%↑</Translate>
      </>
    ),
  },
  {
    title: <Translate>Low overhead</Translate>,
    icon: ArrowDown,
    content: (
      <>
        <Translate>ServiceMesh data plane overhead 70%↓</Translate>
      </>
    ),
  },
  {
    title: <Translate>Security Isolation</Translate>,
    icon: ShieldCheck,
    content: (
      <>
        <Translate>eBPF Secure Traffic Orchestration</Translate>
        <br />
        <Translate>Cgroup-level Orchestration Isolation</Translate>
      </>
    ),
  },
  {
    title: <Translate>Full Stack Visualization*</Translate>,
    icon: Activity,
    content: (
      <>
        <Translate>E2E observation*</Translate>
        <br />
        <Translate>
          Integration with Mainstream Observability Platforms*
        </Translate>
      </>
    ),
  },
  {
    title: <Translate>Open Ecosystem</Translate>,
    icon: Globe,
    content: <Translate>Support for XDS Protocol Standards</Translate>,
  },
];

export default function Why() {
  return (
    <SectionContainer className="whyContainer">
      <h1>
        <Translate>Why Kmesh</Translate>
      </h1>
      <div className="reasonBoxContainer">
        {reasons.map((item, index) => {
          const Icon = item.icon;

          return(
            <div key={index} className="reasonBox">

              {/* ICON */}
              <div className="reasonIcon">
                <Icon />
              </div>

              <p className="reasonTitle">{item.title}</p>
              <div className="reasonContent">{item.content}</div>
          </div>
          );
        })}
      </div>
    </SectionContainer>
  );
}
