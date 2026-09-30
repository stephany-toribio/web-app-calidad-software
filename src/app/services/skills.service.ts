import { Injectable } from '@angular/core';
import { CREO_SKILLS, SOFT_SKILLS, CATEGORY_MAP, CAREER_TAXONOMY, AREA_SKILLS } from '../data/creo-skills.data';

type SkillStatus = "active" | "inactive";

export interface Skill {
  id: string;
  name: string;
  category: string;
  status: SkillStatus;
  usageCount: number;
  isSoft: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class SkillsService {
  private skills: Skill[] = [];
  private _version = 0;

  constructor() {
    this.initSkills();
  }

  getVersion() {
    return this._version;
  }

  private initSkills() {
    // Generate hard skills
    CREO_SKILLS.forEach((name, i) => {
      this.skills.push({
        id: `hard-${i}`,
        name,
        category: CATEGORY_MAP[name] ?? "General",
        status: i % 9 === 7 ? "inactive" : "active",
        usageCount: Math.floor((i * 37 + 11) % 200 + 5),
        isSoft: false
      });
    });

    // Generate soft skills
    SOFT_SKILLS.forEach((name, i) => {
      this.skills.push({
        id: `soft-${i}`,
        name,
        category: "Transversales",
        status: "active",
        usageCount: Math.floor((i * 13 + 7) % 200 + 50),
        isSoft: true
      });
    });
  }

  getSkills(onlyActive = false) {
    return onlyActive ? this.skills.filter(s => s.status === 'active') : this.skills;
  }

  getHardSkills(onlyActive = false) {
    return this.getSkills(onlyActive).filter(s => !s.isSoft);
  }

  getSoftSkills(onlyActive = false) {
    return this.getSkills(onlyActive).filter(s => s.isSoft);
  }

  addSkill(name: string, category: string, isSoft: boolean) {
    const exists = this.skills.find(s => s.name.toLowerCase() === name.toLowerCase());
    if (exists) throw new Error('La habilidad ya existe');

    const prefix = isSoft ? 'soft' : 'hard';
    this.skills.unshift({
      id: `${prefix}-new-${Date.now()}`,
      name: name.trim(),
      category,
      status: 'active',
      usageCount: 0,
      isSoft
    });
    this._version++;
  }

  updateSkill(id: string, name: string, category: string, isSoft: boolean) {
    const exists = this.skills.find(s => s.id !== id && s.name.toLowerCase() === name.toLowerCase());
    if (exists) throw new Error('La habilidad ya existe');

    const idx = this.skills.findIndex(s => s.id === id);
    if (idx !== -1) {
      this.skills[idx].name = name.trim();
      this.skills[idx].category = category;
      this.skills[idx].isSoft = isSoft;
      this._version++;
    }
  }

  toggleStatus(id: string) {
    const idx = this.skills.findIndex(s => s.id === id);
    if (idx !== -1) {
      this.skills[idx].status = this.skills[idx].status === 'active' ? 'inactive' : 'active';
      this._version++;
    }
  }
}
