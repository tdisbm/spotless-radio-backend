import {Track} from "../database/models/Track";
import {sequelize} from "../database";
import {Op} from "sequelize";

export async function updateTracks(oldPath: string, newPath: string) {
    await Track.update(
        {
            location: sequelize.literal(`REPLACE(location, '${oldPath}', '${newPath}')`)
        },
        {
            where: {
                location: {
                    [Op.like]: `${oldPath.split("\\").join("\\\\")}%` // Match all rows where the location starts with oldPath
                }
            }
        }
    )
}

export async function deleteByPath(path: string) {
    await Track.destroy({
        where: {
            location: {
                [Op.like]: `${path.split("\\").join("\\\\")}%`
            }
        }
    })
}