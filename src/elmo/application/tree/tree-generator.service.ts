import { Injectable } from '@nestjs/common';
import { DistrictService } from '../district/district.service';
import { FeedLineService } from '../feed-line/feed-line.service';
import { LoadSiteService } from '../load-site/load-site.service';
import { ChargingStationService } from '../charging-station/charging-station.service';
import { TransformerService } from '../transformer/transformer.service';
import { NodeData, NodeType, TreeData } from './types';
import { groupBy } from 'lodash';
import { DistrictEntity } from '../../adapter/out/entities/district.entity';
import { FeedLineEntity } from '../../adapter/out/entities/feed-line.entity';
import { ChargingStationEntity } from '../../adapter/out/entities/charging-station.entity';
import { LoadSiteEntity } from '../../adapter/out/entities/load-site.entity';
import { TransformerEntity } from '../../adapter/out/entities/transformer.entity';

@Injectable()
export class TreeGeneratorService {
  private treeCache: TreeData | null = null;

  constructor(
    private readonly districtService: DistrictService,
    private readonly feedLineService: FeedLineService,
    private readonly loadSiteService: LoadSiteService,
    private readonly chargingStationService: ChargingStationService,
    private readonly transformerService: TransformerService,
  ) {}

  async getTree(): Promise<TreeData> {
    if (!this.treeCache) {
      this.treeCache = await this.buildTree();
    }
    return this.treeCache;
  }

  async invalidateTreeCache(): Promise<void> {
    this.treeCache = null;
  }

  private async buildTree(): Promise<TreeData> {
    const districts = await this.districtService.getAllDistricts();
    const feedLines = await this.feedLineService.getAllFeedLines();
    const loadSites = await this.loadSiteService.getAllLoadSites();
    const chargingStations =
      await this.chargingStationService.getAllChargingStations();
    const transformers = await this.transformerService.getAllTransformers();

    const districtIdToFeedLines = groupBy(
      feedLines,
      (feedLine) => feedLine.district?.id,
    );
    const feedLineIdToLoadSites = groupBy(
      loadSites,
      (loadSite) => loadSite.feedLine?.id,
    );
    const loadSiteIdToChargingStations = groupBy(
      chargingStations,
      (chargingStation) => chargingStation.loadSite?.id,
    );
    const loadSiteIdToTransformers = groupBy(
      transformers,
      (transformer) => transformer.loadSite?.id,
    );

    return buildTreeData(
      districts,
      districtIdToFeedLines,
      feedLineIdToLoadSites,
      loadSiteIdToChargingStations,
      loadSiteIdToTransformers,
    );
  }
}

type SupportEntities =
  | DistrictEntity
  | FeedLineEntity
  | LoadSiteEntity
  | ChargingStationEntity
  | TransformerEntity;

function buildTreeData(
  districts: DistrictEntity[],
  districtIdToFeedLines: Record<number, FeedLineEntity[]>,
  feedLineIdToLoadSites: Record<number, LoadSiteEntity[]>,
  loadSiteIdToChargingStations: Record<number, ChargingStationEntity[]>,
  loadSiteIdToTransformers: Record<number, TransformerEntity[]>,
): TreeData {
  // inner function to recursively build the tree
  const buildNodeData = (entity: SupportEntities): NodeData => {
    let nodeType: NodeType;
    let childrenEntities: SupportEntities[] | undefined;

    if (entity instanceof DistrictEntity) {
      nodeType = NodeType.District;
      childrenEntities = districtIdToFeedLines[entity.id];
    } else if (entity instanceof FeedLineEntity) {
      nodeType = NodeType.FeedLine;
      childrenEntities = feedLineIdToLoadSites[entity.id];
    } else if (entity instanceof LoadSiteEntity) {
      nodeType = NodeType.LoadSite;
      const childrenChargingStations =
        loadSiteIdToChargingStations[entity.id] || [];
      const childrenTransformers = loadSiteIdToTransformers[entity.id] || [];
      childrenEntities = [...childrenChargingStations, ...childrenTransformers];
    } else if (entity instanceof ChargingStationEntity) {
      nodeType = NodeType.ChargingStation;
    } else if (entity instanceof TransformerEntity) {
      nodeType = NodeType.Transformer;
    } else {
      throw new Error(`Unknown entity type`);
    }

    if (childrenEntities && childrenEntities.length > 0) {
      const children = childrenEntities.map((childEntity) =>
        buildNodeData(childEntity),
      );

      return {
        name: entity.name,
        id: entity.id,
        type: nodeType,
        children,
      };
    }

    return {
      name: entity.name,
      id: entity.id,
      type: nodeType,
    };
  };

  // build the tree starting from the districts
  return districts.map((district) => buildNodeData(district));
}
