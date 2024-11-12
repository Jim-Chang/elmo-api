import { Injectable } from '@nestjs/common';
import { DistrictService } from '../district/district.service';
import { FeederService } from '../feeder/feeder.service';
import { LoadSiteService } from '../load-site/load-site.service';
import { ChargingStationService } from '../charging-station/charging-station.service';
import { TransformerService } from '../transformer/transformer.service';
import { NodeData, NodeType, TreeData } from './types';
import { groupBy } from 'lodash';
import { DistrictEntity } from '../../adapter/out/entities/district.entity';
import { FeederEntity } from '../../adapter/out/entities/feeder.entity';
import { ChargingStationEntity } from '../../adapter/out/entities/charging-station.entity';
import { LoadSiteEntity } from '../../adapter/out/entities/load-site.entity';
import { TransformerEntity } from '../../adapter/out/entities/transformer.entity';
import { UserEntity } from '../../adapter/out/entities/user.entity';

@Injectable()
export class TreeGeneratorService {
  private treeCache: Record<number | null, TreeData> = {}; // districtId -> tree

  constructor(
    private readonly districtService: DistrictService,
    private readonly feederService: FeederService,
    private readonly loadSiteService: LoadSiteService,
    private readonly chargingStationService: ChargingStationService,
    private readonly transformerService: TransformerService,
  ) {}

  async getTree(user: UserEntity): Promise<TreeData> {
    const districtId = user.district?.id;
    if (!this.treeCache[districtId]) {
      this.treeCache[districtId] = await this.buildTree(user);
    }
    return this.treeCache[districtId];
  }

  async invalidateTreeCache(): Promise<void> {
    this.treeCache = {};
  }

  private async buildTree(user: UserEntity): Promise<TreeData> {
    const districts = await this.districtService.getAllActivateDistricts(user);
    const feeders = await this.feederService.getAllFeeders(user);
    const loadSites = await this.loadSiteService.getAllLoadSites();
    const chargingStations =
      await this.chargingStationService.getAllChargingStations();
    const transformers = await this.transformerService.getAllTransformers();

    const districtIdToFeeders = groupBy(
      feeders,
      (feeder) => feeder.district?.id,
    );
    const feederIdToLoadSites = groupBy(
      loadSites,
      (loadSite) => loadSite.feeder?.id,
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
      districtIdToFeeders,
      feederIdToLoadSites,
      loadSiteIdToChargingStations,
      loadSiteIdToTransformers,
    );
  }
}

type SupportEntities =
  | DistrictEntity
  | FeederEntity
  | LoadSiteEntity
  | ChargingStationEntity
  | TransformerEntity;

function buildTreeData(
  districts: DistrictEntity[],
  districtIdToFeeders: Record<number, FeederEntity[]>,
  feederIdToLoadSites: Record<number, LoadSiteEntity[]>,
  loadSiteIdToChargingStations: Record<number, ChargingStationEntity[]>,
  loadSiteIdToTransformers: Record<number, TransformerEntity[]>,
): TreeData {
  // inner function to recursively build the tree
  const buildNodeData = (entity: SupportEntities): NodeData => {
    let nodeType: NodeType;
    let childrenEntities: SupportEntities[] | undefined;

    if (entity instanceof DistrictEntity) {
      nodeType = NodeType.District;
      childrenEntities = districtIdToFeeders[entity.id];
    } else if (entity instanceof FeederEntity) {
      nodeType = NodeType.Feeder;
      childrenEntities = feederIdToLoadSites[entity.id];
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
