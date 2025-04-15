import {
    AllowNull,
    Column,
    DataType,
    Default,
    ForeignKey,
    Model,
    NotNull,
    PrimaryKey,
    Table,
    Unique
} from "sequelize-typescript";
import {Track} from "./Track";
import {Playlist} from "./Playlist";


// noinspection JSAnnotator
@Table({
    timestamps: true,
    updatedAt: false,
    deletedAt: false,
})
export class TrackPlaylist extends Model<TrackPlaylist> {
    @PrimaryKey
    @Default(DataType.UUIDV4)
    @Column(DataType.UUID)
    declare id: string;

    @ForeignKey(() => Track)
    @AllowNull(false)
    @NotNull
    @Unique('trackId-playlistId')
    @Column(DataType.STRING)
    trackId: string;

    @ForeignKey(() => Playlist)
    @AllowNull(false)
    @NotNull
    @Unique('trackId-playlistId')
    @Column(DataType.STRING)
    playlistId: string;

    @AllowNull(false)
    @NotNull
    @Column({type: DataType.INTEGER})
    sortOrder: number;
}