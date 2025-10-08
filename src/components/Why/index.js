import React from "react";
import SectionContainer from "../sectionContainer";
import Translate from "@docusaurus/Translate";
import { Icon } from '@iconify/react';
import "./index.scss";

const SKY_BLUE = "#4FC3F7";

const reasons = [
  {
    title: <Translate>Smooth compatibility</Translate>,
    content: (
      <>
        <Translate>Application-transparent Traffic Management.</Translate>
        <br />
        <Translate>
          Automatic Integration with Istio and other software
        </Translate>
      </>
    ),
    icon: <Icon icon="mdi:connection" color={SKY_BLUE} width="24" height="24" />,
  },
  {
    title: <Translate>High performance</Translate>,
    content: (
      <>
        <Translate>Forwarding latency 60%↓</Translate>
        <br />
        <Translate>Service startup performance 40%↑</Translate>
      </>
    ),
    icon: <Icon icon="mdi:rocket" color={SKY_BLUE} width="24" height="24" />,
  },
  {
    title: <Translate>Low overhead</Translate>,
    content: (
      <>
        <Translate>ServiceMesh data plane overhead 70%↓</Translate>
      </>
    ),
    icon: <Icon icon="mdi:arrow-down-bold" color={SKY_BLUE} width="24" height="24" />,
  },
  {
    title: <Translate>Security Isolation</Translate>,
    content: (
      <>
        <Translate>eBPF Secure Traffic Orchestration</Translate>
        <br />
        <Translate>Cgroup-level Orchestration Isolation</Translate>
      </>
    ),
    icon: <Icon icon="mdi:shield-lock" color={SKY_BLUE} width="24" height="24" />,
  },
  {
    title: <Translate>Full Stack Visualization*</Translate>,
    content: (
      <>
        <Translate>E2E observation*</Translate>
        <br />
        <Translate>
          Integration with Mainstream Observability Platforms*
        </Translate>
      </>
    ),
    icon: <Icon icon="mdi:chart-line" color={SKY_BLUE} width="24" height="24" />,
  },
  {
    title: <Translate>Open Ecosystem</Translate>,
    content: <Translate>Support for XDS Protocol Standards</Translate>,
    icon: <Icon icon="mdi:earth" color={SKY_BLUE} width="24" height="24" />,
  },
];

export default function Why() {
  return (
    <SectionContainer className="whyContainer">
      <h1>
        <Translate>Why Kmesh</Translate>
      </h1>
      <div className="reasonBoxContainer">
        {reasons.map((item, index) => (
          <div key={index} className="reasonBox">
            <div className="reasonIcon">{item.icon}</div>
            <p className="reasonTitle">{item.title}</p>
            <div className="reasonContent">{item.content}</div>
          </div>
        ))}
      </div>
    </SectionContainer>
  );
}