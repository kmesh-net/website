import Layout from "@theme/Layout";
import { HomeSlider } from "../components/slider";
import About from "../components/About";
import Why from "../components/Why";
import Supporters from "../components/Supporters";
import Blogs from "../components/Blogs";
import CNCFInfo from "../components/CNCFInfo";

export const metadata = {
  title: "Kmesh – eBPF Service Mesh",
  description: "High-performance, sidecar-less service mesh powered by eBPF and programmable kernel.",
  keywords: ["kmesh", "ebpf", "service mesh", "kubernetes", "cncf"],
  image: "/img/favicons/favicon.ico",               
  url: "https://kmesh.net",
  twitter: {
    card: "summary_large_image",
    site: "@Kmesh_net",
    creator: "@Kmesh_net",
  },
  robots: "index, follow",
};

export default function Home() {
  return (
    <Layout>
      <HomeSlider />
      <About />
      <Why />
      <Blogs />
      <CNCFInfo />
      <Supporters />
    </Layout>
  );
}