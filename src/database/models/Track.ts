import {
    AllowNull,
    BeforeCreate,
    BeforeSave,
    BeforeUpdate,
    BelongsToMany,
    Column,
    DataType,
    Default,
    Model,
    NotNull,
    PrimaryKey,
    Table,
    Unique
} from "sequelize-typescript";
import {TrackPlaylist} from "./TrackPlaylist";
import {BelongsToManyGetAssociationsMixin, BelongsToManySetAssociationsMixin, NonAttribute} from "sequelize";
import {Playlist} from "./Playlist";
import path from "node:path";


// noinspection JSAnnotator
@Table({
    timestamps: true,
    updatedAt: false,
    deletedAt: false,
})
export class Track extends Model<Track> {
    @PrimaryKey
    @Default(DataType.UUIDV4)
    @Column(DataType.UUID)
    declare id: string;

    @AllowNull(false)
    @NotNull
    @Unique
    @Column({type: DataType.STRING})
    location: string;

    @BelongsToMany(() => Playlist, () => TrackPlaylist)
    declare playlists: NonAttribute<Playlist[]>;

    declare getPlaylists: BelongsToManyGetAssociationsMixin<Playlist>;
    declare setPlaylists: BelongsToManySetAssociationsMixin<Playlist, Playlist['id']>;

    @BeforeSave
    static normalizePath(instance: Track) {
        instance.location = path.normalize(instance.location);
    }

    @BeforeCreate
    static beforeCreateHook(instance: Track) {
        instance.location = path.normalize(instance.location);
    }

    @BeforeUpdate
    static beforeUpdateHook(instance: Track) {
        instance.location = path.normalize(instance.location);
    }
}