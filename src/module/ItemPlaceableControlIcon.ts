import { getCanvas } from './settings';

const ICON_SIZE = 40;
const BORDER_FACTOR = 1.1;

/**
 * A helper for drawing a itemPlaceable Control Icon
 * @type {PIXI.Container}
 */
export class ItemPlaceableControlIcon extends ControlIcon {
  labelText;
  labelTextStyle;
  typeColor;
  statusColor;
  label;
  tint;

  constructor(
    { texture = '', label = '', textStyle = '', typeColor = 0x000000, statusColor = 0x000000, ...options } = {},
    ...args
  ) {
    const size = ItemPlaceableControlIcon.iconSize;
    super({
      texture: texture,
      size: size,
      borderColor: typeColor,
      tint: statusColor,
    });

    // options
    this.labelText = label;
    this.labelTextStyle = textStyle;
    this.typeColor = typeColor;
    this.statusColor = statusColor;
    this.tint = statusColor;

    // add offset
    const offset = size * 0.5;
    this.x -= offset;
    this.y -= offset;

    this.draw();
  }

  /* -------------------------------------------- */

  /** @override */
  async draw() {
    await super.draw();

    // draw background
    this.bg
      .clear()
      .beginFill(this.typeColor || 0, 0.4)
      .lineStyle(2, this.statusColor || 0, 1.0)
      .drawRoundedRect(...this.rect, 5)
      .endFill();

    // label
    this.label = this.label || this.addChild(ItemPlaceableControlIcon.createLabel(this.labelText, this.labelTextStyle));

    return this;
  }

  /* -------------------------------------------- */

  static get scale() {
    //return (getCanvas().dimensions?.size || 100) / 100;
    return 1;
  }

  /* -------------------------------------------- */

  static get iconSize() {
    return ICON_SIZE * ItemPlaceableControlIcon.scale;
  }

  /* -------------------------------------------- */

  static get borderSize() {
    return ItemPlaceableControlIcon.iconSize * BORDER_FACTOR;
  }

  /* -------------------------------------------- */

  /**
   * Create the Label for the ItemPlaceable
   * @return {PreciseText}
   * @private
   */
  static createLabel(text, textStyle) {
    // create the text container
    const label = new PreciseText(text, textStyle);
    label.anchor.set(0.5, 0);

    // set postion
    const iconSize = ItemPlaceableControlIcon.iconSize;
    label.position.set(iconSize * BORDER_FACTOR * 0.5, iconSize * BORDER_FACTOR);

    return label;
  }
}
