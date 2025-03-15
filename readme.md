## Prerequites
* install dotnet, npm and nodejs

## Folder structure
* -- /src dotnet app
* --/infra pulumi/typescript infra
* /build.zip compressed zip file generated by pulumi infra
* --/node_modules npm node modules  
## Instructions to build and deploy dotnet app
* ``` login to pulumi and aws``` login and assume aws role before running the project
* ``` npm install```
install npm depenencies
* ```npm run build```  
creates dotnet build inside /src/packages
    
* ```npm run pulumi:up```
creates and deploys pulumi infra to aws elsatic beanstalk

* ```npm run pulumi:destroy```
destroys pulumi infra and aws resources