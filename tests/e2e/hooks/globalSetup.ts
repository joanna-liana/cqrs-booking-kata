export default async () => {
  console.log("GLOBAL HOOK START")
  global.baseTestUrl = 'http://localhost:3000';
  console.log("GLOBAL HOOK global.baseTestUrl", global.baseTestUrl)
  console.log("GLOBAL HOOK END")
};
