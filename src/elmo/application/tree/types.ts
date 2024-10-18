export enum NodeType {
  District = 'district',
  FeedLine = 'feed-line',
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
