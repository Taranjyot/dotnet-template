## Prerequites
* install dotnet, npm and nodejs
## Instructions to build and deploy dotnet app
* ``` npm install```
install npm depenencies
* ```npm run build```  
creates dotnet build inside /src/packages
    
* ```npm run pulumi:up```
creates and deploys pulumi infra to aws elsatic beanstalk

* ```npm run pulumi:destroy```
destroys pulumi infra and aws resources