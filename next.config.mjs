import nextEnv from "@next/env";
import { loadServerEnvironment } from "./config/runtime-env.mjs";

const { loadEnvConfig } = nextEnv;
loadEnvConfig(process.cwd(), process.env.NODE_ENV !== "production");
loadServerEnvironment(process.env);

/** @type {import('next').NextConfig} */
const nextConfig = {};

export default nextConfig;
