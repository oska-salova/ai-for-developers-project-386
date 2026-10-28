// oxfmt comes from mise, not from package.json.
// Vendored shadcn components expose their whole API surface; the app imports
// only the parts it uses today, so their files are exempt from unused checks.
const knipConfig = {
  ignoreBinaries: ["oxfmt"],
  ignore: ["src/components/ui/**"],
};

export default knipConfig;
