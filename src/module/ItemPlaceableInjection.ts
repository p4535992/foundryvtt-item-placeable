// import { ItemPlaceableLayer } from './ItemPlaceableLayer';
import { ItemPlaceableDocument } from './ItemPlaceableDocument';
import { ItemPlaceable } from './ItemPlaceable';
import { ItemPlaceableControl } from './ItemPlaceableControl';
import { ItemPlaceableConfig } from './ItemPlaceableConfig';
import { BaseItemPlaceable } from './BaseItemPlaceable';
import { getCanvas, getGame } from './settings';
import { ItemPlaceableLayer } from './ItemPlaceableLayer';

const fields = foundry.data.fields;

export const injectItemPlaceables = () => {
  // register itemPlaceable classes
  //@ts-ignore
  CONFIG.ItemPlaceable = {
    documentClass: ItemPlaceableDocument,
    objectClass: ItemPlaceable,
    layerClass: ItemPlaceableLayer,
    sheetClass: ItemPlaceableConfig, // extend ItemSheet
  };

  hookCanvas();
  hookBaseScene();
  hookSceneData();
  hookControlsLayer();
  hookTokenLayer();

  // add itemPlaceables as embedded document for existing scenes
  //@ts-ignore
  for (const scene of getGame().data?.scenes) {
    //@ts-ignore
    scene.itemPlaceables = foundry.utils.duplicate(scene.flags.itemPlaceables || []);
  }

  // Hook createScene and add itemPlaceables as embedded document
  Hooks.on('createScene', (scene, options, userId) => {
    scene.data.itemPlaceables = foundry.utils.duplicate(scene.data.flags.itemPlaceables || []);
  });
};

const hookCanvas = () => {
  // inject ItemPlaceableLayer into the canvas layers list
  const origLayers = CONFIG.Canvas.layers;
  //@ts-ignore
  CONFIG.Canvas.layers = Object.keys(origLayers).reduce((layers, key, i) => {
    layers[key] = origLayers[key];

    // inject itemPlaceables layer after tokens

    if (key === 'tokens') {
      //@ts-ignore
      layers.itemPlaceables = CONFIG.ItemPlaceable.layerClass;
    }

    return layers;
  }, {});

  // FIXME: workaround for #23
  if (!Object.is(Canvas.layers, CONFIG.Canvas.layers)) {
    console.error('Possible incomplete layer injection by other module detected! Trying workaround...');

    const layers = Canvas.layers;
    Object.defineProperty(Canvas, 'layers', {
      get: function () {
        return foundry.utils.mergeObject(CONFIG.Canvas.layers, layers);
      },
    });
  }

  // Hook the Canvas.getLayerByEmbeddedName
  const origGetLayerByEmbeddedName = Canvas.prototype.getLayerByEmbeddedName;
  Canvas.prototype.getLayerByEmbeddedName = function (embeddedName) {
    if (embeddedName === 'ItemPlaceable') {
      return this.itemPlaceables;
    } else {
      return origGetLayerByEmbeddedName.call(this, embeddedName);
    }
  };
};

const hookBaseScene = () => {
  // inject ItemPlaceable into scene metadata
  const BaseScene = foundry.documents.BaseScene;
  const sceneMetadata = Object.getOwnPropertyDescriptor(BaseScene.prototype.constructor, 'metadata');
  // Hook the BaseScene#metadata getter
  Object.defineProperty(BaseScene.prototype.constructor, 'metadata', {
    get: function () {
      //@ts-ignore
      const metadata = sceneMetadata.get.call(this);
      metadata.embedded.ItemPlaceable = BaseItemPlaceable;

      return metadata;
    },
  });

  // add itemPlaceables getter
  Object.defineProperty(BaseScene.prototype, 'itemPlaceables', {
    get: function () {
      return this.data.itemPlaceables;
    },
  });
};

const hookSceneData = () => {
  // inject BaseItemPlaceable into SceneData schema
  const SceneData = foundry.data.SceneData;
  //@ts-ignore
  const sceneSchema = SceneData.prototype.constructor.defineSchema;
  // Hook the SceneData#defineSchema getter
  //@ts-ignore
  SceneData.prototype.constructor.defineSchema = function () {
    const schema = sceneSchema.call(this);
    //@ts-ignore
    schema.itemPlaceables = fields.embeddedCollectionField(BaseItemPlaceable);

    return schema;
  };
};


const hookControlsLayer = () => {
  // Hook ControlsLayer.draw
  const origDraw = ControlsLayer.prototype.draw;
  //@ts-ignore
  ControlsLayer.prototype.draw = function () {
    this.drawItemPlaceables();
    origDraw.call(this);
  };
  //@ts-ignore
  ControlsLayer.prototype.drawItemPlaceables = function () {
    // Create the container
    if (this.itemPlaceables) this.itemPlaceables.destroy({ children: true });
    this.itemPlaceables = this.addChild(new PIXI.Container());

    // Iterate over all itemPlaceables
    //@ts-ignore
    for (const itemPlaceable of canvas.itemPlaceables.placeables) {
      this.createItemPlaceableControl(itemPlaceable);
    }
    //@ts-ignore
    this.itemPlaceables.visible = !canvas.itemPlaceables._active;
  };
  //@ts-ignore
  ControlsLayer.prototype.createItemPlaceableControl = function (itemPlaceable) {
    const ip = this.itemPlaceables.addChild(new ItemPlaceableControl(itemPlaceable));
    ip.visible = false;
    ip.draw();
  };
};


const hookTokenLayer = () => {
  // Hook TokenLayer.activate / deactivate
  const origActivate = TokenLayer.prototype.activate;
  //@ts-ignore
  TokenLayer.prototype.activate = function () {
    origActivate.call(this);
    //@ts-ignore
    if (getCanvas().controls?.itemPlaceables) {
      // getCanvas().controls?.itemPlaceables.visible = true;
      //@ts-ignore
      setProperty(getCanvas().controls?.itemPlaceables,'visible', true);
    }
  };

  const origDeactivate = TokenLayer.prototype.deactivate;
  //@ts-ignore
  TokenLayer.prototype.deactivate = function () {
    origDeactivate.call(this);
    if (getCanvas().controls) {
      //@ts-ignore
      getCanvas().controls.itemPlaceables.visible = false;
    }
  };
};
