import "./styles.css";
import { mountGame } from "./ui/render";

const app = document.querySelector<HTMLDivElement>("#app");

if (!app) {
  throw new Error("Missing #app root");
}

const syncStageScale = () => {
  const scale = Math.min((window.innerWidth - 16) / 1672, (window.innerHeight - 16) / 941);
  const resolvedScale = Math.max(0.12, scale);
  document.documentElement.style.setProperty("--stage-scale", `${resolvedScale}`);
  document.documentElement.style.setProperty("--stage-width", `${1672 * resolvedScale}px`);
  document.documentElement.style.setProperty("--stage-height", `${941 * resolvedScale}px`);
};

syncStageScale();
window.addEventListener("resize", syncStageScale);

mountGame(app);
