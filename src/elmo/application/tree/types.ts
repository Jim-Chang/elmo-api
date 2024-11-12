export enum NodeType {
  District = 'district',
  Feeder = 'feeder',
  LoadSite = 'load-site',
  ChargingStation = 'charging-station',
  Transformer = 'transformer',
}

export type NodeData = {
  id: number;
  name: string;
  type: NodeType;
  children?: NodeData[];
};

export type TreeData = NodeData[];
