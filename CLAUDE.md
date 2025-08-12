


- Critical Firebase Deployment Rules

  NEVER use firebase deploy --only functions on shared projects - it deletes ALL functions not in your local directory.

  Safe function deployment:
  # Deploy specific function only
  firebase deploy --only functions:functionName

  # Deploy multiple specific functions
  firebase deploy --only functions:function1,functions:function2

  NEVER use --force flag without understanding it bypasses safety checks and deletes production resources.

  Before ANY production deployment:
  1. List existing functions: firebase functions:list
  2. Deploy only YOUR specific functions by name
  3. Never deploy all functions unless you have the complete source code

  When working on shared Firebase projects:
  - You're likely working with a subset of functions
  - The main app has functions you don't have locally
  - Deploying "all functions" will delete what's not in your directory

  Red flags to stop immediately:
  - "The following functions are found in your project but do not exist in your local source code"
  - "Aborting because deletion cannot proceed"
  - Any mention of deleting functions you didn't create

  Simple rule: If you didn't create it, don't delete it.