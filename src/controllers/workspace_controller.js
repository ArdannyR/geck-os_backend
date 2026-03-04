import Workspace from "../models/Workspace.js";
import User from "../models/User.js"; 

export const createWorkspace = async (req, res) => {
    try {
        const userId = req.user._id; 
        const { nombre, name } = req.body;
        
        const finalName = nombre || name;

        if (!finalName) return res.status(400).json({ ok: false, msg: "El nombre es obligatorio" });

        const newWorkspace = new Workspace({
            name: finalName,
            owner: userId,
            members: [userId] 
        });

        await newWorkspace.save();

        return res.status(201).json({ 
            ok: true, 
            msg: "Espacio de trabajo creado", 
            workspace: newWorkspace 
        });

    } catch (error) {
        console.error("❌ Error en createWorkspace:", error);
        return res.status(500).json({ ok: false, msg: "Error al crear workspace" });
    }
};

export const inviteMember = async (req, res) => {
    try {
        const { workspaceId, email } = req.body;

        if (!workspaceId || !email) {
            return res.status(400).json({ ok: false, msg: "Faltan datos" });
        }

        const invitedUser = await User.findOne({ email });
        if (!invitedUser) {
            return res.status(404).json({ ok: false, msg: "Usuario no encontrado" });
        }

        const workspace = await Workspace.findById(workspaceId);
        if (!workspace) {
            return res.status(404).json({ ok: false, msg: "Workspace no encontrado" });
        }

        if (workspace.members.includes(invitedUser._id)) {
            return res.status(400).json({ ok: false, msg: "El usuario ya es miembro" });
        }

        workspace.members.push(invitedUser._id);
        await workspace.save();

        return res.status(200).json({ 
            ok: true, 
            msg: `Se añadió a ${invitedUser.name} al equipo.` 
        });

    } catch (error) {
        console.error("❌ Error en inviteMember:", error);
        return res.status(500).json({ ok: false, msg: "Error al invitar miembro" });
    }
};