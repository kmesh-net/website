import Layout from "@theme/Layout";
import { HomeSlider } from "../components/slider";
import About from "../components/About";
import Why from "../components/Why";
import Supporters from "../components/Supporters";
import Blogs from "../components/Blogs";

export default function Home() {
  return (
    <Layout>
      <HomeSlider />
      <About />
      <Why />
      <Blogs />
      <Supporters />
    </Layout>
  );
}
