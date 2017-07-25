```
______  _____ _____  __          
|  _  \/  ___/  __ \/ _|         
| | | |\ `--.| /  \/ |___      __
| | | | `--. \ |   |  _\ \ /\ / /
| |/ / /\__/ / \__/\ |  \ V  V /
|___/  \____/ \____/_|   \_/\_/  

```

# DSCfw - Distributed Sensor Consumer Framework
(Not ready for use beyond experimentation)

This is a WIP platform to manage a network of distributed clients and servers
The architecture is that of a extended pub/sub pattern, generalized to clients which can act as both sensors and consumers.

Clients can send events and updates to a sensor, in a many-to-one relationship.
A sensor broadcasts data to subscribers, in a one-to-many relationship
a subscriber can also act as a sensor, process the data, and re-broadcast it to other subscribers.
A GUID is created for every sensor-broadcast, which is added to a chain, so data can be tracked as it propagates through the network.
Every client is aware of all registered sensors in the network.

A subscriber can choose to be load balanced.

## Installation

## Usage
1. Clone this repository locally, and cd into the root
2. Run `npm install`
3. Run `npm run setup`
4. Follow the instructions for the platforms you want to use

### Servers
* A dscfw server is the primary hub which all the clients connect

#### NodeJS
* Example for how to start a server under express.js can be found under example/express.js

### Clients
* A dscfw client is a node in the network

#### NodeJS
* import clients/node.js

#### Browser
* import clients/browser.js

#### Python
* from dscframework import Client

#### C#
* TODO
