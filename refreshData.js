/**
 *  created by shubham on 26/07/18 4:31 PM
 */

"use strict";

let inputData = require('../../op10-out.json');
const fs = require("fs");

function truncateId(id) {
  if(id.indexOf(":") === -1) return id;
  return id.split(":").reverse().slice(0,2).reverse().join(":");
}

function getLocalId(id) {
  if(id.indexOf(":") === -1) return id;
  return id.split(":").reverse()[0];
}

function getType(id) {
  if(id.indexOf(":") === -1) return id;
  if(id.indexOf("EC2:SecurityGroup") !== -1) return "SecurityGroup";
  return id.split(":")[3].toLowerCase();
}

function format(data, _parent) {
  let nodeMap = new Map();
  let links = new Set();

  function createNode(node, parent, __parent_if_not_set) {
    let id = typeof node === "string" ? node : node.id;
    let n = {
      data: {
        id,
        type: getType(id),
        name: getLocalId(id),
        node_data: {"ns:id" : truncateId(id)},
        local_id: getLocalId(id)
      }
    };
    if(parent) n.data.parent = parent;
    if(!nodeMap.has(id) && __parent_if_not_set && !parent)
      n.data.parent = __parent_if_not_set;
    if(nodeMap.has(id)) n = Object.assign(nodeMap.get(id), n);
    nodeMap.set(id, n);
  }

  function createLinks(node) {
    let src = node.id;
    let targets = node.links || [];
    let parent = node.parent || _parent;

    createNode(src, parent);
    createNode(parent);


    let register = function (source, target) {
      createNode(target, null, parent);
      links.add({ data: { source, target, type: "edge"} });
    };

    if(targets) for(let tgt of targets)
      register(src, tgt);

  }

  for(let x of data) createLinks(x);

  return {nodeMap, links};
}

function main() {
  let nodes = [];
  let edges = [];

  for(let i=0, group; group = inputData[i]; i++){
    let defaultParent = 'group-'+i;
    let {nodeMap, links} = format(group, defaultParent);
    nodes = nodes.concat(Array.from(nodeMap.values()));
    edges = edges.concat(Array.from(links))
  }

  return nodes.concat(edges);
}

let output = main();

fs.writeFileSync('data.json', JSON.stringify(output, null, 4));
